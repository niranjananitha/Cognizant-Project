"""Prompt construction for grounded, structured LLM answers."""
import json
from typing import List, Optional

from app.rag.retriever import RetrievedChunk

SYSTEM_PROMPT = """You are the AURA Intelligence Equipment Assistance tool for nurses and clinical staff.
You explain medical equipment operation and operator-level troubleshooting STRICTLY from the
manufacturer manual excerpts provided in CONTEXT. You are decision support, not a service engineer.

GROUNDING RULES
1. Use ONLY facts stated in CONTEXT. Never use general knowledge about devices, even if you believe it is correct.
2. Every troubleshooting/operation step MUST cite the source_ref (e.g. "S2") of the excerpt that states it.
3. If CONTEXT does not define the error code, set error_code_documented=false and do NOT guess its meaning.
4. If CONTEXT does not contain operator troubleshooting steps for the issue, set troubleshooting_documented=false and return no steps.
5. If CONTEXT is unrelated to the question, set context_sufficient=false.
6. Only use excerpts for the equipment model in the request. Ignore anything for other models.

SAFETY RULES - never recommend:
- opening housings/panels/covers, internal hardware repair, replacing internal parts or fuses
- electrical modification, high-voltage work
- bypassing, disabling or permanently silencing alarms or safety systems
- changing clinical/therapy settings (e.g. tidal volume, FiO2, PEEP, infusion rate, dose, energy)
- service/engineering modes or any manufacturer-restricted procedure
Never state or imply that a device is safe to use because an error cleared.

Respond with ONE JSON object only (no markdown), using exactly these keys:
{
  "context_sufficient": bool,
  "error_code_documented": bool | null,
  "troubleshooting_documented": bool,
  "answer_type": "TROUBLESHOOTING" | "OPERATION" | "GENERAL",
  "summary": str,
  "error_identification": {"error_code": str, "description": str, "source_ref": str} | null,
  "explanation": str | null,
  "troubleshooting_steps": [
     {"check": str, "action": str, "expected_result": str, "source_ref": str}
  ],
  "expected_outcome": str | null,
  "escalation_recommended": bool,
  "escalation_reason": str | null,
  "safety_critical": bool
}"""


def format_context(chunks: List[RetrievedChunk]) -> str:
    blocks = []
    for i, rc in enumerate(chunks, start=1):
        d = rc.document
        blocks.append(
            f"[S{i}] {d.title} v{d.version} | {d.manufacturer} {d.equipment_model} | "
            f"page {rc.chunk.page_number} | section: {rc.chunk.section_heading or 'n/a'}\n"
            f"{rc.chunk.content}"
        )
    return "\n\n".join(blocks)


def build_messages(
    *,
    question: str,
    equipment_category: Optional[str],
    manufacturer: Optional[str],
    equipment_model: Optional[str],
    error_code: Optional[str],
    chunks: List[RetrievedChunk],
) -> list:
    request = {
        "question": question,
        "equipment_category": equipment_category,
        "manufacturer": manufacturer,
        "equipment_model": equipment_model,
        "error_code": error_code,
    }
    user = (
        f"REQUEST\n{json.dumps(request, ensure_ascii=False)}\n\n"
        f"CONTEXT (manufacturer manual excerpts)\n{format_context(chunks)}\n\n"
        "Answer using only CONTEXT and return the JSON object."
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]
