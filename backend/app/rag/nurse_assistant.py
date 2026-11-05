"""Nurse Equipment Assistance orchestrator.

Pipeline
    question -> equipment filter -> error-code detection -> retrieval (TF-IDF)
    -> decision gates (no docs / ambiguous model / unknown code / no relevant context)
    -> NVIDIA LLM generation over retrieved chunks ONLY (if configured)
    -> validation (every step must cite a retrieved chunk; unsafe steps removed)
    -> structured answer

If the LLM is not configured or fails, the answer falls back to verbatim manual excerpts
(RETRIEVAL_ONLY). Nothing in this module invents manufacturer content: in fallback
mode every step/description shown is a line copied from an uploaded manual."""
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.rag.error_codes import extract_error_codes, lines_mentioning_code, normalize_error_code
from app.rag.document_processor import is_heading
from app.rag.prompts import build_messages
from app.rag.retriever import RetrievalResult, RetrievedChunk, candidate_query, retrieve
from app.rag.safety import (
    IF_PROBLEM_CONTINUES, SAFETY_DISCLAIMER, check_step_safety,
    is_life_support_category, is_safety_critical,
)
from app.schemas.rag import (
    AnswerStatus, AssistantAnswer, ChatRequest, ErrorIdentification, EscalationAdvice,
    LLMInfo, RetrievalInfo, SourceReference, TroubleshootingStep,
)
from app.services.llm_service import (
    LLMService, LLMError, LLMInvalidResponseError, LLMNotConfiguredError,
)

_TROUBLESHOOT_RE = re.compile(
    r"\b(troubleshoot\w*|alarm\w*|error\w*|fault\w*|warning\w*|fail\w*|not\s+working|won'?t|"
    r"doesn'?t|does\s+not|cannot|can'?t|stopped|beep\w*|flashing|problem|issue|occlusion|leak\w*|low\s+battery)\b",
    re.IGNORECASE,
)
_LIST_ITEM_RE = re.compile(r"^\s*(?:step\s*)?(\d{1,2})[.):]\s+(.*\S)|^\s*[-•*▪]\s+(.*\S)", re.IGNORECASE)
_MAX_STEPS = 12


@dataclass
class AssistantResult:
    answer: AssistantAnswer
    retrieved: List[RetrievedChunk] = field(default_factory=list)
    normalized_error_code: Optional[str] = None


def _source_label(rc: RetrievedChunk) -> str:
    d = rc.document
    return f"{d.title} v{d.version}, p.{rc.chunk.page_number}"


def _build_sources(chunks: List[RetrievedChunk]) -> List[SourceReference]:
    refs = []
    for i, rc in enumerate(chunks, start=1):
        d = rc.document
        excerpt = rc.chunk.content
        refs.append(SourceReference(
            ref_id=f"S{i}", chunk_id=rc.chunk.id, document_id=d.id, document_title=d.title,
            document_type=d.document_type.value if d.document_type else None,
            manufacturer=d.manufacturer, equipment_model=d.equipment_model, version=d.version,
            page_number=rc.chunk.page_number, section_heading=rc.chunk.section_heading,
            relevance_score=rc.score, error_code_match=rc.error_code_match,
            excerpt=excerpt if len(excerpt) <= 1200 else excerpt[:1200] + " …",
        ))
    return refs


def _retrieval_info(r: RetrievalResult) -> RetrievalInfo:
    return RetrievalInfo(
        candidates_considered=r.candidates_considered, documents_available=r.documents_available,
        chunks_returned=len(r.chunks), top_score=round(r.top_score, 4), threshold=r.threshold,
        error_code_requested=r.error_code_requested, error_code_found=r.error_code_found,
    )


def _extract_list_items(text: str) -> List[str]:
    """Verbatim numbered/bulleted items from a manual excerpt (wrapped lines joined)."""
    items: List[str] = []
    current: Optional[str] = None
    for raw in (text or "").splitlines():
        line = raw.strip()
        if not line:
            if current:
                items.append(current)
                current = None
            continue
        m = _LIST_ITEM_RE.match(line)
        if m:
            if current:
                items.append(current)
            current = (m.group(2) or m.group(3)).strip()
        elif current is not None and not is_heading(line) and not current.endswith((".", "!", "?", ":")):
            # wrapped continuation of the same step
            current = f"{current} {line}"
        elif current:
            items.append(current)
            current = None
    if current:
        items.append(current)
    return items


class NurseAssistant:
    def __init__(self, llm: LLMService):
        self.llm = llm

    # ------------------------------------------------------------------ public
    def answer(self, db: Session, hospital_id: str, req: ChatRequest) -> AssistantResult:
        code = normalize_error_code(req.error_code)
        if not code:
            detected = extract_error_codes(req.question)
            if len(detected) == 1:
                code = detected.pop()

        troubleshooting = bool(code) or bool(_TROUBLESHOOT_RE.search(req.question))
        safety_critical = is_safety_critical(req.question)

        result = retrieve(
            db, hospital_id=hospital_id, question=req.question,
            equipment_category=req.equipment_category, equipment_model=req.equipment_model,
            manufacturer=req.manufacturer, normalized_error_code=code,
            top_k=settings.RAG_TOP_K, min_relevance=settings.RAG_MIN_RELEVANCE,
        )
        ctx = _Ctx(req=req, code=code, result=result, troubleshooting=troubleshooting,
                   safety_critical=safety_critical)

        # Gate 1: nothing uploaded for this equipment
        if result.documents_available == 0:
            return self._no_knowledge_base(db, hospital_id, ctx)

        # Gate 2: no model chosen and results span several models -> never mix models
        if not req.equipment_model and len(result.models) > 1:
            return self._finish(ctx, AnswerStatus.MODEL_SELECTION_REQUIRED,
                summary=("Manuals for more than one model matched. Select the exact equipment model so "
                         "that only that model's manufacturer instructions are used."),
                available_models=result.models, include_sources=False,
                escalate_reason="Model not specified; instructions from different models must not be combined.",
                escalate=False)

        # Gate 3: error code entered but not documented in any manual for this model
        if code and not result.error_code_found:
            return self._finish(ctx, AnswerStatus.ERROR_CODE_NOT_FOUND,
                summary=(f"Error code {req.error_code or code} was not found in the uploaded manuals for "
                         f"{self._equipment_label(req)}. No verified meaning or troubleshooting procedure "
                         "is available, so none is given."),
                error_identification=ErrorIdentification(
                    error_code=req.error_code or code, equipment_model=req.equipment_model,
                    description=None, documented=False),
                include_sources=False, escalate=True,
                escalate_reason="Undocumented error code - requires Biomedical Engineering assessment.")

        # Gate 4: nothing relevant above the relevance threshold
        if not result.chunks:
            return self._finish(ctx, AnswerStatus.NO_RELEVANT_CONTEXT,
                summary=("The available manuals do not contain information relevant to this question, "
                         "so no verified answer can be given."),
                include_sources=False, escalate=troubleshooting,
                escalate_reason="No documented guidance found for the reported issue.")

        if not self.llm.is_configured:
            return self._retrieval_only(ctx, llm_status="NOT_CONFIGURED",
                                        reason="AI explanation is not configured")
        try:
            data = self.llm.chat_json(build_messages(
                question=req.question, equipment_category=req.equipment_category,
                manufacturer=req.manufacturer or self._single(result, "manufacturer"),
                equipment_model=req.equipment_model or self._single(result, "equipment_model"),
                error_code=req.error_code or code, chunks=result.chunks))
        except LLMNotConfiguredError:
            return self._retrieval_only(ctx, llm_status="NOT_CONFIGURED",
                                        reason="AI explanation is not configured")
        except LLMInvalidResponseError:
            return self._retrieval_only(ctx, llm_status="INVALID_OUTPUT",
                                        reason="the AI response could not be validated")
        except LLMError:
            return self._retrieval_only(ctx, llm_status="UNAVAILABLE",
                                        reason="the AI service is currently unavailable")
        return self._validate_llm(ctx, data)

    # ------------------------------------------------------------------ gates
    def _no_knowledge_base(self, db: Session, hospital_id: str, ctx: "_Ctx") -> AssistantResult:
        req = ctx.req
        warnings = []
        others: List[str] = []
        if req.equipment_model:
            rows = candidate_query(db, hospital_id, req.equipment_category, None, None).all()
            others = sorted({doc.equipment_model for _, doc in rows})
            if others:
                warnings.append(
                    "Manuals exist only for other models in this category ("
                    + ", ".join(others) + "). Instructions for a different model must not be used.")
        return self._finish(ctx, AnswerStatus.NO_KNOWLEDGE_BASE,
            summary=(f"No manufacturer documentation has been uploaded for {self._equipment_label(req)}. "
                     "No verified guidance can be provided."),
            available_models=others, include_sources=False, warnings=warnings,
            escalate=ctx.troubleshooting,
            escalate_reason="No manufacturer documentation available for this equipment.")

    # ------------------------------------------------------------------ fallback
    def _retrieval_only(self, ctx: "_Ctx", llm_status: str, reason: str) -> AssistantResult:
        result, code = ctx.result, ctx.code
        refs = {f"S{i}": rc for i, rc in enumerate(result.chunks, start=1)}
        primary = [(k, rc) for k, rc in refs.items() if rc.error_code_match] if code else list(refs.items())[:2]

        error_ident = None
        if code:
            desc, desc_ref = None, None
            for ref, rc in primary:
                lines = list(lines_mentioning_code(code, f"{rc.chunk.section_heading or ''}\n{rc.chunk.content}"))
                if lines:
                    desc, desc_ref = " ".join(lines[:2]), ref
                    break
            error_ident = ErrorIdentification(
                error_code=ctx.req.error_code or code,
                equipment_model=ctx.req.equipment_model or self._single(result, "equipment_model"),
                description=desc, documented=True, source_ref=desc_ref,
                source_label=_source_label(refs[desc_ref]) if desc_ref else None)

        steps, removed = [], []
        for ref, rc in primary:
            for item in _extract_list_items(rc.chunk.content):
                ok, why = check_step_safety(item)
                if not ok:
                    removed.append(why)
                    continue
                steps.append(TroubleshootingStep(step=len(steps) + 1, action=item, source_ref=ref,
                                                 source_label=_source_label(rc), verbatim=True))
                if len(steps) >= _MAX_STEPS:
                    break
            if len(steps) >= _MAX_STEPS:
                break

        warnings = [f"Showing verbatim manual excerpts because {reason}. Read each step in its source context."]
        warnings += self._removed_warnings(removed)

        if ctx.troubleshooting and code and not steps:
            return self._finish(ctx, AnswerStatus.NO_TROUBLESHOOTING_PROCEDURE,
                summary=("The error code is listed in the manual, but no operator-level troubleshooting "
                         "steps were found for it. Do not attempt undocumented actions."),
                error_identification=error_ident, warnings=warnings, llm_status=llm_status,
                escalate=True, escalate_reason="Documented error with no operator troubleshooting procedure.")

        return self._finish(ctx, AnswerStatus.RETRIEVAL_ONLY,
            summary=(f"AI explanation unavailable ({reason}). Relevant manufacturer manual excerpts are shown "
                     "below exactly as written. Follow only steps stated in the manual."),
            error_identification=error_ident, steps=steps, warnings=warnings, llm_status=llm_status,
            answer_type="TROUBLESHOOTING" if ctx.troubleshooting else "OPERATION",
            escalate=bool(code), escalate_reason=(
                "If the documented steps do not resolve the issue, escalate to Biomedical Engineering."))

    # ------------------------------------------------------------------ LLM validation
    def _validate_llm(self, ctx: "_Ctx", data: Dict) -> AssistantResult:
        result, code, req = ctx.result, ctx.code, ctx.req
        refs = {f"S{i}": rc for i, rc in enumerate(result.chunks, start=1)}
        warnings: List[str] = []

        def ref_of(value) -> Optional[str]:
            if not isinstance(value, str):
                return None
            m = re.search(r"S\d+", value.upper())
            return m.group(0) if m and m.group(0) in refs else None

        def safe_text(value) -> Optional[str]:
            if not isinstance(value, str) or not value.strip():
                return None
            ok, why = check_step_safety(value)
            if not ok:
                warnings.append(f"Part of the AI response was withheld because it involved {why}.")
                return None
            return value.strip()

        answer_type = data.get("answer_type") if data.get("answer_type") in ("TROUBLESHOOTING", "OPERATION", "GENERAL") else (
            "TROUBLESHOOTING" if ctx.troubleshooting else "GENERAL")
        llm_critical = bool(data.get("safety_critical"))
        ctx.safety_critical = ctx.safety_critical or llm_critical

        if data.get("context_sufficient") is not True:
            return self._finish(ctx, AnswerStatus.NO_RELEVANT_CONTEXT,
                summary=("The retrieved manual sections do not answer this question, so no verified "
                         "answer can be given."),
                llm_status="OK", llm_used=True, escalate=ctx.troubleshooting,
                escalate_reason="No documented guidance found for the reported issue.")

        if code and data.get("error_code_documented") is False:
            return self._finish(ctx, AnswerStatus.ERROR_CODE_NOT_FOUND,
                summary=(f"The manuals mention {req.error_code or code}, but do not define its meaning for this "
                         "equipment. No verified meaning or procedure is given."),
                error_identification=ErrorIdentification(error_code=req.error_code or code,
                    equipment_model=req.equipment_model, description=None, documented=False),
                llm_status="OK", llm_used=True, escalate=True,
                escalate_reason="Error code meaning not documented - requires Biomedical Engineering assessment.")

        # Steps: keep only those citing a retrieved chunk and passing safety checks.
        steps: List[TroubleshootingStep] = []
        uncited, removed = 0, []
        raw_steps = data.get("troubleshooting_steps") or []
        for raw in raw_steps if isinstance(raw_steps, list) else []:
            if not isinstance(raw, dict):
                continue
            action = raw.get("action")
            ref = ref_of(raw.get("source_ref"))
            if not isinstance(action, str) or not action.strip():
                continue
            if not ref:
                uncited += 1
                continue
            combined = " ".join(str(raw.get(k) or "") for k in ("check", "action", "expected_result"))
            ok, why = check_step_safety(combined)
            if not ok:
                removed.append(why)
                continue
            steps.append(TroubleshootingStep(
                step=len(steps) + 1, check=(raw.get("check") or None), action=action.strip(),
                expected_result=(raw.get("expected_result") or None), source_ref=ref,
                source_label=_source_label(refs[ref])))
            if len(steps) >= _MAX_STEPS:
                break
        if uncited:
            warnings.append(f"{uncited} AI-suggested step(s) were removed because they did not cite an uploaded manual.")
        warnings += self._removed_warnings(removed)

        error_ident = None
        if code:
            ei = data.get("error_identification") if isinstance(data.get("error_identification"), dict) else {}
            ei_ref = ref_of(ei.get("source_ref"))
            error_ident = ErrorIdentification(
                error_code=req.error_code or code,
                equipment_model=req.equipment_model or self._single(result, "equipment_model"),
                description=safe_text(ei.get("description")) if ei_ref else None,
                documented=True, source_ref=ei_ref,
                source_label=_source_label(refs[ei_ref]) if ei_ref else None)

        explanation = safe_text(data.get("explanation"))
        expected = safe_text(data.get("expected_outcome"))
        summary = safe_text(data.get("summary")) or "Answer generated from the uploaded manufacturer manuals."

        no_procedure = answer_type == "TROUBLESHOOTING" and (
            data.get("troubleshooting_documented") is False or not steps)
        if no_procedure:
            return self._finish(ctx, AnswerStatus.NO_TROUBLESHOOTING_PROCEDURE,
                summary=("The manuals describe this issue but do not provide verified operator-level "
                         "troubleshooting steps for it. Do not attempt undocumented actions."),
                error_identification=error_ident, explanation=explanation, warnings=warnings,
                llm_status="OK", llm_used=True, answer_type=answer_type, escalate=True,
                escalate_reason="No documented operator troubleshooting procedure.")

        reason = data.get("escalation_reason") if isinstance(data.get("escalation_reason"), str) else None
        return self._finish(ctx, AnswerStatus.GROUNDED_ANSWER,
            summary=summary, error_identification=error_ident, explanation=explanation,
            steps=steps, expected_outcome=expected, warnings=warnings, llm_status="OK", llm_used=True,
            answer_type=answer_type,
            escalate=bool(data.get("escalation_recommended")) or answer_type == "TROUBLESHOOTING",
            escalate_reason=safe_text(reason) or
                "If the documented steps do not resolve the issue, escalate to Biomedical Engineering.")

    # ------------------------------------------------------------------ helpers
    @staticmethod
    def _removed_warnings(removed: List[str]) -> List[str]:
        return [f"A step was withheld because it involved {why}; this is not an operator-level action."
                for why in sorted(set(removed))]

    @staticmethod
    def _single(result: RetrievalResult, attr: str) -> Optional[str]:
        values = {getattr(c.document, attr) for c in result.chunks}
        return values.pop() if len(values) == 1 else None

    @staticmethod
    def _equipment_label(req: ChatRequest) -> str:
        parts = [p for p in (req.manufacturer, req.equipment_model) if p]
        return " ".join(parts) if parts else req.equipment_category

    def _finish(self, ctx: "_Ctx", status: AnswerStatus, *, summary: str,
                error_identification: Optional[ErrorIdentification] = None,
                explanation: Optional[str] = None, steps: Optional[List[TroubleshootingStep]] = None,
                expected_outcome: Optional[str] = None, available_models: Optional[List[str]] = None,
                warnings: Optional[List[str]] = None, include_sources: bool = True,
                llm_status: str = "SKIPPED", llm_used: bool = False, answer_type: Optional[str] = None,
                escalate: bool = False, escalate_reason: str = "") -> AssistantResult:
        urgent = ctx.safety_critical
        if urgent:
            escalate = True
            escalate_reason = ("Possible safety-critical condition reported. Ensure patient safety per hospital "
                               "protocol and escalate urgently. " + escalate_reason).strip()
        if escalate and is_life_support_category(ctx.req.equipment_category) and not urgent:
            escalate_reason = escalate_reason + " Life-support equipment: follow backup-equipment protocol."

        answer = AssistantAnswer(
            answer_status=status,
            answer_type=answer_type or ("TROUBLESHOOTING" if ctx.troubleshooting else "GENERAL"),
            summary=summary,
            error_identification=error_identification,
            explanation=explanation,
            troubleshooting_steps=steps or [],
            expected_outcome=expected_outcome,
            if_problem_continues=IF_PROBLEM_CONTINUES if (escalate or ctx.troubleshooting) else [],
            escalation=EscalationAdvice(recommended=escalate, urgency="URGENT" if urgent else "ROUTINE",
                                        reason=escalate_reason or "No escalation needed for an informational question."),
            sources=_build_sources(ctx.result.chunks) if include_sources else [],
            available_models=available_models or [],
            warnings=warnings or [],
            safety_disclaimer=SAFETY_DISCLAIMER,
            retrieval=_retrieval_info(ctx.result),
            llm=LLMInfo(provider=getattr(self.llm, "provider", "nvidia"), used=llm_used, status=llm_status),
        )
        return AssistantResult(answer=answer,
                               retrieved=ctx.result.chunks if include_sources else [],
                               normalized_error_code=ctx.code)


@dataclass
class _Ctx:
    req: ChatRequest
    code: Optional[str]
    result: RetrievalResult
    troubleshooting: bool
    safety_critical: bool
