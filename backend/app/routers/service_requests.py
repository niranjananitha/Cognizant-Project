import math
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.session import get_db
from app.models.equipment import Equipment, EquipmentStatus
from app.models.service_request import ServiceRequest, ServiceStatus, ServicePriority
from app.models.maintenance import MaintenanceService
from app.models.audit_log import AuditLog
from app.models.user import User, UserRole
from app.models.service_escalation import ServiceEscalation
from app.models.chat import ChatConversation, ChatMessage, ChatRole
from app.rag.safety import is_life_support_category, is_safety_critical
from app.schemas.service_request import (
    ServiceRequestOut, ServiceRequestCreate, ServiceRequestUpdate, PaginatedServiceRequestOut,
    EscalationCreate,
)
from app.dependencies.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])

_PRIORITY_ORDER = [ServicePriority.LOW, ServicePriority.MEDIUM, ServicePriority.HIGH, ServicePriority.CRITICAL]


def _get_sr(db: Session, id: int, user: User) -> ServiceRequest:
    """Load a ticket; chatbot escalations are only visible inside their own hospital."""
    sr = db.query(ServiceRequest).filter(ServiceRequest.id == id).first()
    if not sr or (sr.escalation is not None and sr.escalation.hospital_id != user.hospital_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service request not found.")
    return sr


def _max_priority(*priorities: ServicePriority) -> ServicePriority:
    return max(priorities, key=_PRIORITY_ORDER.index)


def _build_escalation(db: Session, esc: EscalationCreate, equip: Equipment, user: User, issue: str) -> ServiceEscalation:
    """Capture troubleshooting context. Manual references and the identified issue are
    taken from the server-side chat record, not trusted from the client."""
    conv = None
    references, identified, answer_urgent = [], esc.identified_issue, False
    if esc.conversation_id is not None:
        conv = db.query(ChatConversation).filter(
            ChatConversation.id == esc.conversation_id,
            ChatConversation.user_id == user.id,
            ChatConversation.hospital_id == user.hospital_id,
        ).first()
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
        last = (db.query(ChatMessage)
                .filter(ChatMessage.conversation_id == conv.id, ChatMessage.role == ChatRole.ASSISTANT)
                .order_by(ChatMessage.id.desc()).first())
        if last is not None:
            answer = last.response_json or {}
            references = [{
                "document_id": s.document_id, "document_title": s.document_title,
                "version": s.document_version, "page_number": s.page_number,
                "section_heading": s.section_heading,
            } for s in last.sources]
            ident = answer.get("error_identification") or {}
            identified = identified or ident.get("description") or answer.get("summary")
            answer_urgent = (answer.get("escalation") or {}).get("urgency") == "URGENT"

    critical = (esc.patient_safety_concern or answer_urgent
                or is_safety_critical(esc.nurse_description, issue, identified))
    return ServiceEscalation(
        hospital_id=user.hospital_id,
        conversation_id=conv.id if conv else None,
        department=equip.department or user.department,
        equipment_category=(conv.equipment_category if conv and conv.equipment_category else equip.category),
        manufacturer=(conv.manufacturer if conv and conv.manufacturer else equip.manufacturer),
        equipment_model=(conv.equipment_model if conv and conv.equipment_model else equip.model),
        error_code=esc.error_code,
        nurse_description=esc.nurse_description.strip(),
        identified_issue=identified,
        troubleshooting_attempted=[s.strip()[:500] for s in esc.troubleshooting_attempted if s and s.strip()],
        troubleshooting_outcome=esc.troubleshooting_outcome,
        manual_references=references,
        safety_critical=critical,
    )

def generate_ticket_number(db: Session) -> str:
    count = db.query(ServiceRequest).count() + 1
    return f"SR-{datetime.now().year}-{count:04d}"

@router.get("", response_model=PaginatedServiceRequestOut)
def list_service_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[ServiceStatus] = None,
    priority: Optional[ServicePriority] = None,
    equipment_id: Optional[int] = None,
    assigned_engineer_id: Optional[int] = None,
    raised_by_me: bool = False,
    source: Optional[str] = Query(None, pattern="^CHATBOT$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ServiceRequest).outerjoin(
        ServiceEscalation, ServiceEscalation.service_request_id == ServiceRequest.id)
    # Hospital isolation for chatbot escalations
    query = query.filter(
        (ServiceEscalation.id.is_(None)) | (ServiceEscalation.hospital_id == current_user.hospital_id))
    if source == "CHATBOT":
        query = query.filter(ServiceEscalation.id.is_not(None))
    if raised_by_me:
        query = query.filter(ServiceRequest.raised_by_id == current_user.id)

    if status:
        query = query.filter(ServiceRequest.status == status)
    if priority:
        query = query.filter(ServiceRequest.priority == priority)
    if equipment_id:
        query = query.filter(ServiceRequest.equipment_id == equipment_id)
    if assigned_engineer_id:
        query = query.filter(ServiceRequest.assigned_engineer_id == assigned_engineer_id)

    # If maintenance engineer role, return assigned or unassigned tickets
    if current_user.role == UserRole.MAINTENANCE_ENGINEER:
        pass  # Engineers see all tickets to pick up

    total = query.count()
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    items = query.order_by(ServiceRequest.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedServiceRequestOut(
        items=[ServiceRequestOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{id}", response_model=ServiceRequestOut)
def get_service_request_detail(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sr = _get_sr(db, id, current_user)
    return sr

@router.post("", response_model=ServiceRequestOut, status_code=status.HTTP_201_CREATED)
def raise_service_request(
    req: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    equip = db.query(Equipment).filter(Equipment.id == req.equipment_id).first()
    if not equip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target equipment not found.")

    ticket = generate_ticket_number(db)

    priority = req.priority
    escalation = None
    if req.escalation is not None:
        escalation = _build_escalation(db, req.escalation, equip, current_user, req.issue)
        floor = ServicePriority.HIGH if is_life_support_category(escalation.equipment_category) else ServicePriority.MEDIUM
        priority = _max_priority(priority, floor)
        if escalation.safety_critical:
            priority = ServicePriority.CRITICAL

    sr = ServiceRequest(
        ticket_number=ticket,
        equipment_id=equip.id,
        raised_by_id=current_user.id,
        priority=priority,
        issue=req.issue,
        observed_symptoms=req.observed_symptoms,
        additional_observation=req.additional_observation,
        risk_score=req.risk_score or 0.0,
        status=ServiceStatus.RAISED
    )
    
    # Update equipment status to UNDER_MAINTENANCE if HIGH/CRITICAL priority
    if priority in [ServicePriority.HIGH, ServicePriority.CRITICAL]:
        equip.status = EquipmentStatus.UNDER_MAINTENANCE

    db.add(sr)
    if escalation is not None:
        sr.escalation = escalation

    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="SERVICE_REQUEST_ESCALATED_FROM_CHATBOT" if escalation is not None else "SERVICE_REQUEST_CREATED",
        entity_type="SERVICE_REQUEST",
        new_value={"ticket_number": ticket, "issue": req.issue, "priority": priority.value,
                   **({"error_code": escalation.error_code, "safety_critical": escalation.safety_critical,
                       "hospital_id": escalation.hospital_id} if escalation is not None else {})}
    )
    db.add(audit)
    
    db.commit()
    db.refresh(sr)
    return sr

@router.patch("/{id}", response_model=ServiceRequestOut)
def update_service_request(
    id: int,
    req: ServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER, UserRole.HOSPITAL_ADMIN]))
):
    sr = _get_sr(db, id, current_user)

    update_data = req.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(sr, key, val)

    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/acknowledge", response_model=ServiceRequestOut)
def acknowledge_service_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = _get_sr(db, id, current_user)

    sr.status = ServiceStatus.ACKNOWLEDGED
    sr.assigned_engineer_id = current_user.id
    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/start-diagnosis", response_model=ServiceRequestOut)
def start_diagnosis(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = _get_sr(db, id, current_user)

    sr.status = ServiceStatus.IN_DIAGNOSIS
    sr.assigned_engineer_id = current_user.id
    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/start-service", response_model=ServiceRequestOut)
def start_service(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = _get_sr(db, id, current_user)

    sr.status = ServiceStatus.IN_SERVICE
    sr.assigned_engineer_id = current_user.id
    
    equip = db.query(Equipment).filter(Equipment.id == sr.equipment_id).first()
    if equip:
        equip.status = EquipmentStatus.UNDER_MAINTENANCE

    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/waiting-for-parts", response_model=ServiceRequestOut)
def mark_waiting_for_parts(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = _get_sr(db, id, current_user)

    sr.status = ServiceStatus.WAITING_FOR_PARTS
    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/delay", response_model=ServiceRequestOut)
def mark_service_delayed(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = _get_sr(db, id, current_user)

    sr.status = ServiceStatus.SERVICE_DELAYED
    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/complete", response_model=ServiceRequestOut)
def complete_service_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER]))
):
    sr = _get_sr(db, id, current_user)

    sr.status = ServiceStatus.COMPLETED

    # Reset equipment status to AVAILABLE
    equip = db.query(Equipment).filter(Equipment.id == sr.equipment_id).first()
    if equip:
        equip.status = EquipmentStatus.AVAILABLE
        equip.last_service_date = datetime.now().date()

    # Log Audit
    audit = AuditLog(
        user_id=current_user.id,
        action="SERVICE_COMPLETED",
        entity_type="SERVICE_REQUEST",
        entity_id=sr.id,
        new_value={"ticket_number": sr.ticket_number, "status": "COMPLETED"}
    )
    db.add(audit)

    db.commit()
    db.refresh(sr)
    return sr

@router.post("/{id}/reject", response_model=ServiceRequestOut)
def reject_service_request(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.MAINTENANCE_ENGINEER, UserRole.HOSPITAL_ADMIN]))
):
    sr = _get_sr(db, id, current_user)

    sr.status = ServiceStatus.REJECTED
    db.commit()
    db.refresh(sr)
    return sr


@router.post("/{id}/verify", response_model=ServiceRequestOut)
def verify_resolution(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker([UserRole.NURSE_DOCTOR, UserRole.HOSPITAL_ADMIN]))
):
    """Clinical staff confirm a resolved chatbot escalation works as expected (RESOLVED -> VERIFIED)."""
    sr = _get_sr(db, id, current_user)
    if sr.escalation is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only chatbot escalations use verification.")
    if current_user.role == UserRole.NURSE_DOCTOR and sr.raised_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the staff member who raised this request can verify it.")
    if sr.status != ServiceStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The request must be resolved by Biomedical Engineering before verification.")
    if sr.escalation.verified_at is None:
        sr.escalation.verified_at = datetime.now(timezone.utc)
        sr.escalation.verified_by_id = current_user.id
        db.add(AuditLog(user_id=current_user.id, action="SERVICE_REQUEST_VERIFIED", entity_type="SERVICE_REQUEST",
                        entity_id=sr.id, new_value={"ticket_number": sr.ticket_number}))
    db.commit()
    db.refresh(sr)
    return sr
