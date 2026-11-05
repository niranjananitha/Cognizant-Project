"""Equipment Assistance chat history and the manual references each answer used."""
import enum
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ChatRole(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class ChatConversation(Base):
    __tablename__ = "chat_conversations"
    __table_args__ = (
        Index("ix_chatconv_user_updated", "user_id", "updated_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    hospital_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    equipment_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    equipment_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    equipment_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("equipment.id", ondelete="SET NULL"), nullable=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Equipment assistance")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    messages = relationship(
        "ChatMessage", back_populates="conversation", cascade="all, delete-orphan",
        order_by="ChatMessage.id",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    role: Mapped[ChatRole] = mapped_column(Enum(ChatRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    error_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    answer_status: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    response_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("ChatConversation", back_populates="messages")
    sources = relationship("ChatMessageSource", back_populates="message", cascade="all, delete-orphan")


class ChatMessageSource(Base):
    """Snapshot of a retrieved manual reference. Titles/pages are copied so history
    stays readable even after the source document is deleted."""
    __tablename__ = "chat_message_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("knowledge_chunks.id", ondelete="SET NULL"), nullable=True)
    document_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("knowledge_documents.id", ondelete="SET NULL"), index=True, nullable=True)
    document_title: Mapped[str] = mapped_column(String(255), nullable=False)
    document_version: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    section_heading: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)

    message = relationship("ChatMessage", back_populates="sources")
