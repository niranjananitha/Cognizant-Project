"""Nurse Equipment Assistance chatbot endpoints."""
import re
from collections import defaultdict
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies.auth import RoleChecker
from app.models.audit_log import AuditLog
from app.models.chat import ChatConversation, ChatMessage, ChatMessageSource, ChatRole
from app.models.equipment import Equipment
from app.models.knowledge import DocumentStatus, KnowledgeDocument
from app.models.user import User, UserRole
from app.rag.nurse_assistant import NurseAssistant
from app.schemas.rag import (
    AssistantAnswer, ChatMessageOut, ChatRequest, ChatResponse,
    ConversationDetail, ConversationSummary, MachineOption, ManualModel,
)
from app.services.llm_service import LLMService, get_llm_service

router = APIRouter(prefix="/rag", tags=["Equipment Assistance (RAG)"])

# Nurses / clinical staff are the primary users; engineers and admins may also consult manuals.
chat_roles = RoleChecker([UserRole.NURSE_DOCTOR, UserRole.MAINTENANCE_ENGINEER, UserRole.HOSPITAL_ADMIN])


def _own_conversation(db: Session, conversation_id: int, user: User) -> ChatConversation:
    conv = db.query(ChatConversation).filter(
        ChatConversation.id == conversation_id,
        ChatConversation.user_id == user.id,
        ChatConversation.hospital_id == user.hospital_id,
    ).first()
    if not conv:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    return conv


def _message_out(m: ChatMessage) -> ChatMessageOut:
    answer = None
    if m.role == ChatRole.ASSISTANT and m.response_json:
        try:
            answer = AssistantAnswer.model_validate(m.response_json)
        except ValueError:
            answer = None
    return ChatMessageOut(id=m.id, role=m.role.value, content=m.content, error_code=m.error_code,
                          answer_status=m.answer_status, answer=answer, created_at=m.created_at)


def _tokens(*texts: Optional[str]) -> set:
    return {t for text in texts if text for t in re.split(r"[^a-z0-9]+", text.lower()) if t}


def _manual_matches_machine(manual: ManualModel, machine: Equipment) -> bool:
    """A manual covers a machine when every word of the manual's model name appears in the
    machine's inventory name/model (e.g. "Respironics V60" -> "Respironics V60 Ventilator")."""
    model_tokens = _tokens(manual.equipment_model)
    return bool(model_tokens) and model_tokens <= _tokens(machine.machine_name, machine.model)


@router.get("/machines", response_model=List[MachineOption])
def list_machines(db: Session = Depends(get_db), current_user: User = Depends(chat_roles)):
    """Every machine in the hospital inventory, with the uploaded manuals that cover it."""
    rows = (
        db.query(KnowledgeDocument.equipment_category, KnowledgeDocument.manufacturer,
                 KnowledgeDocument.equipment_model, func.count(KnowledgeDocument.id))
        .filter(KnowledgeDocument.hospital_id == current_user.hospital_id,
                KnowledgeDocument.status == DocumentStatus.READY,
                KnowledgeDocument.is_active.is_(True))
        .group_by(KnowledgeDocument.equipment_category, KnowledgeDocument.manufacturer,
                  KnowledgeDocument.equipment_model)
        .all()
    )
    manuals_by_category = defaultdict(list)
    for category, maker, model, count in rows:
        manuals_by_category[(category or "").strip().lower()].append(
            ManualModel(manufacturer=maker, equipment_model=model, document_count=count))

    out = []
    for m in db.query(Equipment).order_by(Equipment.category, Equipment.machine_name).all():
        category_models = sorted(manuals_by_category.get((m.category or "").strip().lower(), []),
                                 key=lambda x: (x.manufacturer, x.equipment_model))
        out.append(MachineOption(
            id=m.id, machine_id=m.machine_id, machine_name=m.machine_name, category=m.category,
            manufacturer=m.manufacturer, model=m.model, department=m.department, location=m.location,
            status=m.status.value if m.status else None,
            matched_models=[x for x in category_models if _manual_matches_machine(x, m)],
            category_models=category_models))
    return out


@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(chat_roles),
    llm: LLMService = Depends(get_llm_service),
):
    if req.equipment_id is not None and not db.query(Equipment.id).filter(Equipment.id == req.equipment_id).first():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Selected device not found.")

    if req.conversation_id:
        conv = _own_conversation(db, req.conversation_id, current_user)
    else:
        conv = ChatConversation(hospital_id=current_user.hospital_id, user_id=current_user.id,
                                title=req.question[:120])
        db.add(conv)
    conv.equipment_category = req.equipment_category
    conv.equipment_model = req.equipment_model or conv.equipment_model
    conv.manufacturer = req.manufacturer or conv.manufacturer
    conv.equipment_id = req.equipment_id or conv.equipment_id
    conv.updated_at = datetime.now(timezone.utc)
    db.flush()

    user_msg = ChatMessage(conversation_id=conv.id, role=ChatRole.USER, content=req.question,
                           error_code=req.error_code)
    db.add(user_msg)
    db.flush()

    result = NurseAssistant(llm).answer(db, current_user.hospital_id, req)
    answer = result.answer

    # Record the manufacturer/model the manuals resolved to (used later for escalation tickets).
    makers = {rc.document.manufacturer for rc in result.retrieved}
    models = {rc.document.equipment_model for rc in result.retrieved}
    if not conv.manufacturer and len(makers) == 1:
        conv.manufacturer = makers.pop()
    if not conv.equipment_model and len(models) == 1:
        conv.equipment_model = models.pop()

    assistant_msg = ChatMessage(
        conversation_id=conv.id, role=ChatRole.ASSISTANT, content=answer.summary,
        error_code=result.normalized_error_code, answer_status=answer.answer_status.value,
        response_json=answer.model_dump(mode="json"))
    db.add(assistant_msg)
    db.flush()
    for rc in result.retrieved:
        db.add(ChatMessageSource(
            message_id=assistant_msg.id, chunk_id=rc.chunk.id, document_id=rc.document.id,
            document_title=rc.document.title, document_version=rc.document.version,
            page_number=rc.chunk.page_number, section_heading=rc.chunk.section_heading,
            relevance_score=rc.score))

    db.add(AuditLog(
        user_id=current_user.id, action="RAG_QUERY", entity_type="CHAT_MESSAGE", entity_id=assistant_msg.id,
        new_value={"conversation_id": conv.id, "category": req.equipment_category,
                   "model": req.equipment_model, "error_code": req.error_code,
                   "answer_status": answer.answer_status.value, "llm_status": answer.llm.status,
                   "sources": len(result.retrieved)}))
    db.commit()
    db.refresh(assistant_msg)

    return ChatResponse(conversation_id=conv.id, user_message_id=user_msg.id,
                        message_id=assistant_msg.id, created_at=assistant_msg.created_at, answer=answer)


@router.get("/history", response_model=List[ConversationSummary])
def list_history(
    q: Optional[str] = Query(None, max_length=200, description="Search titles and messages"),
    equipment_id: Optional[int] = Query(None, description="Only conversations about this machine"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(chat_roles),
):
    counts = (db.query(ChatMessage.conversation_id, func.count(ChatMessage.id).label("n"),
                       func.max(ChatMessage.id).label("last_id"))
              .group_by(ChatMessage.conversation_id).subquery())
    query = (
        db.query(ChatConversation, func.coalesce(counts.c.n, 0), Equipment.machine_name, Equipment.machine_id,
                 ChatMessage.answer_status)
        .outerjoin(counts, counts.c.conversation_id == ChatConversation.id)
        .outerjoin(ChatMessage, ChatMessage.id == counts.c.last_id)
        .outerjoin(Equipment, Equipment.id == ChatConversation.equipment_id)
        .filter(ChatConversation.user_id == current_user.id,
                ChatConversation.hospital_id == current_user.hospital_id)
    )
    if equipment_id is not None:
        query = query.filter(ChatConversation.equipment_id == equipment_id)
    term = (q or "").strip().lower()
    if term:
        like = f"%{term}%"
        in_messages = (db.query(ChatMessage.conversation_id)
                       .filter(or_(func.lower(ChatMessage.content).like(like),
                                   func.lower(ChatMessage.error_code).like(like))))
        query = query.filter(or_(func.lower(ChatConversation.title).like(like),
                                 ChatConversation.id.in_(in_messages)))
    rows = query.order_by(ChatConversation.updated_at.desc(), ChatConversation.id.desc()).limit(limit).all()
    return [ConversationSummary(
        id=c.id, title=c.title, equipment_category=c.equipment_category, manufacturer=c.manufacturer,
        equipment_model=c.equipment_model, equipment_id=c.equipment_id, machine_name=machine_name,
        machine_code=machine_code, last_answer_status=last_status, message_count=n,
        created_at=c.created_at, updated_at=c.updated_at)
        for c, n, machine_name, machine_code, last_status in rows]


@router.delete("/history/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(chat_roles),
):
    conv = _own_conversation(db, conversation_id, current_user)
    db.add(AuditLog(user_id=current_user.id, action="RAG_HISTORY_DELETE", entity_type="CHAT_CONVERSATION",
                    entity_id=conv.id, old_value={"title": conv.title, "messages": len(conv.messages)}))
    db.delete(conv)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/history/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(chat_roles),
):
    conv = _own_conversation(db, conversation_id, current_user)
    messages = [_message_out(m) for m in conv.messages]
    machine = db.get(Equipment, conv.equipment_id) if conv.equipment_id else None
    last_status = next((m.answer_status for m in reversed(messages) if m.answer_status), None)
    return ConversationDetail(
        id=conv.id, title=conv.title, equipment_category=conv.equipment_category,
        manufacturer=conv.manufacturer, equipment_model=conv.equipment_model,
        equipment_id=conv.equipment_id, machine_name=machine.machine_name if machine else None,
        machine_code=machine.machine_id if machine else None, last_answer_status=last_status,
        message_count=len(messages),
        created_at=conv.created_at, updated_at=conv.updated_at, messages=messages)
