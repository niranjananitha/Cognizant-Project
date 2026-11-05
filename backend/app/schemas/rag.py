from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AnswerStatus(str, Enum):
    GROUNDED_ANSWER = "GROUNDED_ANSWER"            # LLM answer validated against retrieved manuals
    RETRIEVAL_ONLY = "RETRIEVAL_ONLY"              # AI unavailable: verbatim manual excerpts only
    NO_KNOWLEDGE_BASE = "NO_KNOWLEDGE_BASE"        # no manuals uploaded for this equipment
    NO_RELEVANT_CONTEXT = "NO_RELEVANT_CONTEXT"    # manuals exist but nothing relevant
    ERROR_CODE_NOT_FOUND = "ERROR_CODE_NOT_FOUND"  # code not documented in manuals
    NO_TROUBLESHOOTING_PROCEDURE = "NO_TROUBLESHOOTING_PROCEDURE"  # code documented, no operator steps
    MODEL_SELECTION_REQUIRED = "MODEL_SELECTION_REQUIRED"          # results span several models


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    equipment_category: str = Field(..., min_length=2, max_length=100)
    equipment_model: Optional[str] = Field(None, max_length=100)
    manufacturer: Optional[str] = Field(None, max_length=100)
    error_code: Optional[str] = Field(None, max_length=50)
    equipment_id: Optional[int] = None
    conversation_id: Optional[int] = None

    @field_validator("question", "equipment_category")
    @classmethod
    def _strip_required(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("must contain at least 2 non-space characters")
        return v

    @field_validator("equipment_model", "manufacturer", "error_code")
    @classmethod
    def _strip_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip()
        return v or None


class SourceReference(BaseModel):
    ref_id: str
    chunk_id: Optional[int] = None
    document_id: Optional[int] = None
    document_title: str
    document_type: Optional[str] = None
    manufacturer: Optional[str] = None
    equipment_model: Optional[str] = None
    version: Optional[str] = None
    page_number: Optional[int] = None
    section_heading: Optional[str] = None
    relevance_score: float = 0.0
    error_code_match: bool = False
    excerpt: str = ""


class ErrorIdentification(BaseModel):
    error_code: str
    equipment_model: Optional[str] = None
    description: Optional[str] = None
    documented: bool
    source_ref: Optional[str] = None
    source_label: Optional[str] = None


class TroubleshootingStep(BaseModel):
    step: int
    check: Optional[str] = None
    action: str
    expected_result: Optional[str] = None
    source_ref: Optional[str] = None
    source_label: Optional[str] = None
    verbatim: bool = False


class EscalationAdvice(BaseModel):
    recommended: bool
    urgency: str = "ROUTINE"  # ROUTINE | URGENT
    reason: str


class RetrievalInfo(BaseModel):
    candidates_considered: int
    documents_available: int
    chunks_returned: int
    top_score: float
    threshold: float
    error_code_requested: bool
    error_code_found: bool
    retriever: str = "tfidf-cosine"


class LLMInfo(BaseModel):
    provider: str = "nvidia"
    used: bool = False
    status: str  # OK | NOT_CONFIGURED | UNAVAILABLE | INVALID_OUTPUT | SKIPPED


class AssistantAnswer(BaseModel):
    answer_status: AnswerStatus
    answer_type: str = "GENERAL"
    summary: str
    error_identification: Optional[ErrorIdentification] = None
    explanation: Optional[str] = None
    troubleshooting_steps: List[TroubleshootingStep] = []
    expected_outcome: Optional[str] = None
    if_problem_continues: List[str] = []
    escalation: EscalationAdvice
    sources: List[SourceReference] = []
    available_models: List[str] = []
    warnings: List[str] = []
    safety_disclaimer: str
    retrieval: RetrievalInfo
    llm: LLMInfo


class ChatResponse(BaseModel):
    conversation_id: int
    user_message_id: int
    message_id: int
    created_at: datetime
    answer: AssistantAnswer


class ChatMessageOut(BaseModel):
    id: int
    role: str
    content: str
    error_code: Optional[str] = None
    answer_status: Optional[str] = None
    answer: Optional[AssistantAnswer] = None
    created_at: datetime


class ManualModel(BaseModel):
    manufacturer: str
    equipment_model: str
    document_count: int


class MachineOption(BaseModel):
    """A hospital inventory machine the nurse can ask about, with the manuals that cover it."""
    id: int
    machine_id: str
    machine_name: str
    category: str
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    matched_models: List[ManualModel] = []   # manuals whose model matches this machine
    category_models: List[ManualModel] = []  # every manual uploaded for this machine's category


class ConversationSummary(BaseModel):
    id: int
    title: str
    equipment_category: Optional[str] = None
    manufacturer: Optional[str] = None
    equipment_model: Optional[str] = None
    equipment_id: Optional[int] = None
    machine_name: Optional[str] = None
    machine_code: Optional[str] = None
    last_answer_status: Optional[str] = None
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetail(ConversationSummary):
    messages: List[ChatMessageOut]
