"""Persistence for knowledge documents: ingest, replace, delete."""
import hashlib
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.chat import ChatMessageSource
from app.models.knowledge import DocumentStatus, DocumentType, KnowledgeChunk, KnowledgeDocument
from app.rag.document_processor import DocumentProcessingError, process_document

logger = logging.getLogger("medequip")


def content_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def ingest_document(
    db: Session,
    *,
    hospital_id: str,
    uploaded_by_id: int,
    filename: str,
    data: bytes,
    equipment_category: str,
    manufacturer: str,
    equipment_model: str,
    title: str,
    document_type: DocumentType,
    version: str,
) -> KnowledgeDocument:
    """Create the document row, extract + chunk text, and store chunks.

    Processing failures are recorded on the document (status FAILED) rather than
    raised, so administrators can see why a manual is not searchable."""
    doc = KnowledgeDocument(
        hospital_id=hospital_id,
        equipment_category=equipment_category,
        manufacturer=manufacturer,
        equipment_model=equipment_model,
        title=title,
        document_type=document_type,
        version=version,
        original_filename=filename[:255],
        file_size_bytes=len(data),
        content_hash=content_hash(data),
        status=DocumentStatus.PROCESSING,
        is_active=True,
        uploaded_by_id=uploaded_by_id,
    )
    db.add(doc)
    db.flush()

    try:
        processed = process_document(filename, data, settings.RAG_CHUNK_SIZE, settings.RAG_CHUNK_OVERLAP)
    except DocumentProcessingError as exc:
        doc.status = DocumentStatus.FAILED
        doc.processing_error = str(exc)
        doc.is_active = False
        logger.warning(f"Knowledge document {doc.id} failed processing: {exc}")
        return doc

    for c in processed.chunks:
        db.add(KnowledgeChunk(
            document_id=doc.id,
            hospital_id=hospital_id,
            chunk_index=c.chunk_index,
            page_number=c.page_number,
            section_heading=c.section_heading,
            content=c.content,
            error_codes=c.error_codes,
        ))
    doc.page_count = processed.page_count
    doc.chunk_count = len(processed.chunks)
    doc.status = DocumentStatus.READY
    doc.processing_error = None
    return doc


def remove_chunks(db: Session, document_id: int) -> int:
    """Delete a document's chunks and detach chat references to them.

    Chat history keeps its snapshot (title/page) so past answers stay readable."""
    chunk_ids = [cid for (cid,) in db.query(KnowledgeChunk.id).filter(KnowledgeChunk.document_id == document_id)]
    if chunk_ids:
        db.query(ChatMessageSource).filter(ChatMessageSource.chunk_id.in_(chunk_ids)).update(
            {ChatMessageSource.chunk_id: None}, synchronize_session=False)
    deleted = db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == document_id).delete(
        synchronize_session=False)
    return deleted


def delete_document(db: Session, doc: KnowledgeDocument) -> int:
    removed = remove_chunks(db, doc.id)
    db.query(ChatMessageSource).filter(ChatMessageSource.document_id == doc.id).update(
        {ChatMessageSource.document_id: None}, synchronize_session=False)
    db.query(KnowledgeDocument).filter(KnowledgeDocument.superseded_by_id == doc.id).update(
        {KnowledgeDocument.superseded_by_id: None}, synchronize_session=False)
    db.expire(doc, ["chunks"])
    db.delete(doc)
    return removed


def supersede(db: Session, old: KnowledgeDocument, new: KnowledgeDocument) -> None:
    """Retire `old` in favour of `new`: its chunks leave the retrieval set."""
    remove_chunks(db, old.id)
    old.status = DocumentStatus.SUPERSEDED
    old.is_active = False
    old.chunk_count = 0
    old.superseded_by_id = new.id


def find_duplicate(db: Session, hospital_id: str, equipment_model: str, digest: str) -> Optional[KnowledgeDocument]:
    return (
        db.query(KnowledgeDocument)
        .filter(
            KnowledgeDocument.hospital_id == hospital_id,
            KnowledgeDocument.equipment_model == equipment_model,
            KnowledgeDocument.content_hash == digest,
            KnowledgeDocument.status == DocumentStatus.READY,
            KnowledgeDocument.is_active.is_(True),
        )
        .first()
    )
