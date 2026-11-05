from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.knowledge import DocumentStatus, DocumentType


class KnowledgeDocumentOut(BaseModel):
    id: int
    hospital_id: str
    equipment_category: str
    manufacturer: str
    equipment_model: str
    title: str
    document_type: DocumentType
    version: str
    original_filename: str
    file_size_bytes: int
    page_count: int
    chunk_count: int
    status: DocumentStatus
    processing_error: Optional[str] = None
    is_active: bool
    superseded_by_id: Optional[int] = None
    uploaded_by_id: Optional[int] = None
    uploaded_by_name: Optional[str] = None
    uploaded_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KnowledgeDocumentList(BaseModel):
    items: List[KnowledgeDocumentOut]
    total: int


class KnowledgeChunkOut(BaseModel):
    id: int
    chunk_index: int
    page_number: int
    section_heading: Optional[str] = None
    content: str
    error_codes: List[str] = []


class KnowledgeDocumentDetail(KnowledgeDocumentOut):
    chunks: List[KnowledgeChunkOut] = []


class CatalogModel(BaseModel):
    manufacturer: str
    equipment_model: str
    document_count: int


class CatalogCategory(BaseModel):
    equipment_category: str
    models: List[CatalogModel]


class EquipmentCatalog(BaseModel):
    categories: List[CatalogCategory]
