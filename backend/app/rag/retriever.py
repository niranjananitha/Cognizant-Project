"""Metadata-filtered retrieval over knowledge chunks.

Ranking is TF-IDF + cosine similarity. This is *lexical* matching (shared words),
not semantic understanding: "SpO2 probe" will not match "pulse oximetry sensor"
unless the manual uses those words. The ranker sits behind `BaseRanker` so an
embedding-based ranker can replace it later without touching the API or the
orchestrator.

The index is built per query from the filtered candidate set (one hospital, one
equipment model). For per-model manual collections this is small and guarantees a
deleted or superseded document can never be served from a stale index."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional, Sequence

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.knowledge import DocumentStatus, KnowledgeChunk, KnowledgeDocument
from app.rag.error_codes import chunk_contains_code

ERROR_CODE_BOOST = 0.35


class BaseRanker(ABC):
    @abstractmethod
    def rank(self, query: str, texts: Sequence[str]) -> List[float]:
        """Return one relevance score in [0, 1] per text."""


class TfidfRanker(BaseRanker):
    def rank(self, query: str, texts: Sequence[str]) -> List[float]:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        if not texts or not query.strip():
            return [0.0] * len(texts)
        vectorizer = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
            token_pattern=r"(?u)\b\w[\w\-]*\b",
        )
        try:
            matrix = vectorizer.fit_transform(list(texts))
        except ValueError:  # empty vocabulary (e.g. only stop words)
            return [0.0] * len(texts)
        query_vec = vectorizer.transform([query])
        return [float(s) for s in cosine_similarity(query_vec, matrix)[0]]


@dataclass
class RetrievedChunk:
    chunk: KnowledgeChunk
    document: KnowledgeDocument
    score: float
    lexical_score: float
    error_code_match: bool = False


@dataclass
class RetrievalResult:
    chunks: List[RetrievedChunk] = field(default_factory=list)
    candidates_considered: int = 0
    documents_available: int = 0
    error_code_requested: bool = False
    error_code_found: bool = False
    threshold: float = 0.0

    @property
    def top_score(self) -> float:
        return max((c.score for c in self.chunks), default=0.0)

    @property
    def models(self) -> List[str]:
        return sorted({c.document.equipment_model for c in self.chunks})


def _ci_equals(column, value: str):
    return func.lower(column) == value.strip().lower()


def candidate_query(
    db: Session,
    hospital_id: str,
    equipment_category: Optional[str],
    equipment_model: Optional[str],
    manufacturer: Optional[str],
):
    q = (
        db.query(KnowledgeChunk, KnowledgeDocument)
        .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
        .filter(
            KnowledgeDocument.hospital_id == hospital_id,
            KnowledgeChunk.hospital_id == hospital_id,
            KnowledgeDocument.status == DocumentStatus.READY,
            KnowledgeDocument.is_active.is_(True),
        )
    )
    if equipment_category:
        q = q.filter(_ci_equals(KnowledgeDocument.equipment_category, equipment_category))
    if equipment_model:
        q = q.filter(_ci_equals(KnowledgeDocument.equipment_model, equipment_model))
    if manufacturer:
        q = q.filter(_ci_equals(KnowledgeDocument.manufacturer, manufacturer))
    return q


def retrieve(
    db: Session,
    *,
    hospital_id: str,
    question: str,
    equipment_category: Optional[str],
    equipment_model: Optional[str],
    manufacturer: Optional[str] = None,
    normalized_error_code: Optional[str] = None,
    top_k: int = 5,
    min_relevance: float = 0.08,
    ranker: Optional[BaseRanker] = None,
) -> RetrievalResult:
    ranker = ranker or TfidfRanker()
    rows = candidate_query(db, hospital_id, equipment_category, equipment_model, manufacturer).all()

    result = RetrievalResult(
        candidates_considered=len(rows),
        documents_available=len({doc.id for _, doc in rows}),
        error_code_requested=bool(normalized_error_code),
        threshold=min_relevance,
    )
    if not rows:
        return result

    texts = [
        f"{doc.title}\n{chunk.section_heading or ''}\n{chunk.content}"
        for chunk, doc in rows
    ]
    query_text = question
    if normalized_error_code:
        query_text = f"{question} {normalized_error_code} error code alarm"
    scores = ranker.rank(query_text, texts)

    scored: List[RetrievedChunk] = []
    for (chunk, doc), lexical in zip(rows, scores):
        code_match = bool(normalized_error_code) and chunk_contains_code(
            normalized_error_code, chunk.error_codes, f"{chunk.section_heading or ''}\n{chunk.content}"
        )
        score = min(1.0, lexical + ERROR_CODE_BOOST) if code_match else lexical
        if code_match or score >= min_relevance:
            scored.append(RetrievedChunk(chunk=chunk, document=doc, score=round(score, 4),
                                         lexical_score=round(lexical, 4), error_code_match=code_match))

    scored.sort(key=lambda r: (r.error_code_match, r.score), reverse=True)
    result.chunks = scored[:top_k]
    result.error_code_found = any(r.error_code_match for r in scored)
    return result
