"""Knowledge Base Manager: Hospital Administrators upload and manage manufacturer manuals."""
from collections import defaultdict
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.dependencies.auth import RoleChecker, get_current_user
from app.models.audit_log import AuditLog
from app.models.knowledge import DocumentStatus, DocumentType, KnowledgeChunk, KnowledgeDocument
from app.models.user import User, UserRole
from app.rag import knowledge_service
from app.rag.document_processor import SUPPORTED_EXTENSIONS
from app.schemas.knowledge import (
    CatalogCategory, CatalogModel, EquipmentCatalog, KnowledgeChunkOut,
    KnowledgeDocumentDetail, KnowledgeDocumentList, KnowledgeDocumentOut,
)

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])

require_admin = RoleChecker([UserRole.HOSPITAL_ADMIN])


def _to_out(doc: KnowledgeDocument) -> KnowledgeDocumentOut:
    out = KnowledgeDocumentOut.model_validate(doc)
    out.uploaded_by_name = doc.uploaded_by.full_name if doc.uploaded_by else None
    return out


def _clean(value: str, field: str, max_len: int) -> str:
    v = (value or "").strip()
    if len(v) < 1:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field} is required.")
    if len(v) > max_len:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{field} must be at most {max_len} characters.")
    return v


async def _read_upload(file: UploadFile) -> bytes:
    name = (file.filename or "").lower()
    if not any(name.endswith(ext) for ext in SUPPORTED_EXTENSIONS):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Only PDF and TXT documents are supported.")
    limit = settings.KNOWLEDGE_MAX_UPLOAD_MB * 1024 * 1024
    data = await file.read(limit + 1)
    if not data:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="The uploaded file is empty.")
    if len(data) > limit:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=f"File exceeds the {settings.KNOWLEDGE_MAX_UPLOAD_MB} MB limit.")
    return data


def _get_doc(db: Session, doc_id: int, user: User) -> KnowledgeDocument:
    doc = db.query(KnowledgeDocument).filter(
        KnowledgeDocument.id == doc_id, KnowledgeDocument.hospital_id == user.hospital_id).first()
    if not doc:  # other hospitals' documents are indistinguishable from missing ones
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


def _audit(db: Session, user: User, action: str, doc: KnowledgeDocument, extra: Optional[dict] = None):
    db.add(AuditLog(
        user_id=user.id, action=action, entity_type="KNOWLEDGE_DOCUMENT", entity_id=doc.id,
        new_value={"title": doc.title, "model": doc.equipment_model, "version": doc.version,
                   "status": doc.status.value, "hospital_id": doc.hospital_id, **(extra or {})},
    ))


@router.post("/upload", response_model=KnowledgeDocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    equipment_category: str = Form(...),
    manufacturer: str = Form(...),
    equipment_model: str = Form(...),
    title: str = Form(...),
    document_type: DocumentType = Form(...),
    version: str = Form("1.0"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    category = _clean(equipment_category, "Equipment category", 100)
    maker = _clean(manufacturer, "Manufacturer", 100)
    model = _clean(equipment_model, "Equipment model", 100)
    doc_title = _clean(title, "Document title", 255)
    doc_version = _clean(version, "Version", 30)
    data = await _read_upload(file)

    if knowledge_service.find_duplicate(db, current_user.hospital_id, model, knowledge_service.content_hash(data)):
        raise HTTPException(status.HTTP_409_CONFLICT,
                            detail="This exact document is already in the knowledge base for this model.")

    doc = knowledge_service.ingest_document(
        db, hospital_id=current_user.hospital_id, uploaded_by_id=current_user.id,
        filename=file.filename or "document", data=data, equipment_category=category,
        manufacturer=maker, equipment_model=model, title=doc_title,
        document_type=document_type, version=doc_version)
    _audit(db, current_user, "KNOWLEDGE_DOCUMENT_UPLOADED", doc,
           {"chunks": doc.chunk_count, "error": doc.processing_error})
    db.commit()
    db.refresh(doc)
    return _to_out(doc)


@router.get("/documents", response_model=KnowledgeDocumentList)
def list_documents(
    equipment_category: Optional[str] = Query(None, max_length=100),
    equipment_model: Optional[str] = Query(None, max_length=100),
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(KnowledgeDocument).filter(KnowledgeDocument.hospital_id == current_user.hospital_id)
    is_admin = current_user.role == UserRole.HOSPITAL_ADMIN
    if not (is_admin and include_inactive):
        q = q.filter(KnowledgeDocument.is_active.is_(True))
    if not is_admin:  # clinical staff only see searchable manuals
        q = q.filter(KnowledgeDocument.status == DocumentStatus.READY)
    if equipment_category:
        q = q.filter(func.lower(KnowledgeDocument.equipment_category) == equipment_category.strip().lower())
    if equipment_model:
        q = q.filter(func.lower(KnowledgeDocument.equipment_model) == equipment_model.strip().lower())
    docs = q.order_by(KnowledgeDocument.uploaded_at.desc(), KnowledgeDocument.id.desc()).all()
    return KnowledgeDocumentList(items=[_to_out(d) for d in docs], total=len(docs))


@router.get("/catalog", response_model=EquipmentCatalog)
def equipment_catalog(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Equipment categories -> manufacturer/model pairs that have searchable manuals."""
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
    grouped = defaultdict(list)
    for category, maker, model, count in rows:
        grouped[category].append(CatalogModel(manufacturer=maker, equipment_model=model, document_count=count))
    return EquipmentCatalog(categories=[
        CatalogCategory(equipment_category=c, models=sorted(m, key=lambda x: (x.manufacturer, x.equipment_model)))
        for c, m in sorted(grouped.items())
    ])


@router.get("/documents/{doc_id}", response_model=KnowledgeDocumentDetail)
def get_document(
    doc_id: int,
    include_chunks: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    doc = _get_doc(db, doc_id, current_user)
    out = KnowledgeDocumentDetail(**_to_out(doc).model_dump())
    if include_chunks:
        chunks = db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == doc.id).order_by(
            KnowledgeChunk.chunk_index).all()
        out.chunks = [KnowledgeChunkOut(
            id=c.id, chunk_index=c.chunk_index, page_number=c.page_number,
            section_heading=c.section_heading, content=c.content,
            error_codes=(c.error_codes or "").split()) for c in chunks]
    return out


@router.post("/documents/{doc_id}/replace", response_model=KnowledgeDocumentOut, status_code=status.HTTP_201_CREATED)
async def replace_document(
    doc_id: int,
    file: UploadFile = File(...),
    version: str = Form(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Upload a newer version. The old version is retired only if the new one processes successfully."""
    old = _get_doc(db, doc_id, current_user)
    if not old.is_active or old.status != DocumentStatus.READY:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Only an active, ready document can be replaced.")
    new_version = _clean(version, "Version", 30)
    data = await _read_upload(file)

    new = knowledge_service.ingest_document(
        db, hospital_id=current_user.hospital_id, uploaded_by_id=current_user.id,
        filename=file.filename or old.original_filename, data=data,
        equipment_category=old.equipment_category, manufacturer=old.manufacturer,
        equipment_model=old.equipment_model,
        title=_clean(title, "Document title", 255) if title and title.strip() else old.title,
        document_type=old.document_type, version=new_version)
    if new.status == DocumentStatus.READY:
        knowledge_service.supersede(db, old, new)
    _audit(db, current_user, "KNOWLEDGE_DOCUMENT_REPLACED", new,
           {"replaces_document_id": old.id, "previous_version": old.version,
            "error": new.processing_error})
    db.commit()
    db.refresh(new)
    return _to_out(new)


@router.delete("/documents/{doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    doc = _get_doc(db, doc_id, current_user)
    _audit(db, current_user, "KNOWLEDGE_DOCUMENT_DELETED", doc)
    removed = knowledge_service.delete_document(db, doc)
    db.commit()
    return {"deleted": True, "document_id": doc_id, "chunks_removed": removed}
