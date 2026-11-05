"""Text extraction and page-preserving chunking for manufacturer documents."""
import io
import re
from dataclasses import dataclass, field
from typing import List, Optional

from app.rag.error_codes import extract_error_codes, serialize_codes

SUPPORTED_EXTENSIONS = {".pdf", ".txt"}


class DocumentProcessingError(Exception):
    """Raised when a document cannot be turned into searchable text."""


@dataclass
class PageText:
    page_number: int
    text: str


@dataclass
class ChunkData:
    chunk_index: int
    page_number: int
    section_heading: Optional[str]
    content: str
    error_codes: Optional[str] = None


@dataclass
class ProcessedDocument:
    page_count: int
    chunks: List[ChunkData] = field(default_factory=list)


# ---------------------------------------------------------------- extraction

def extract_pages(filename: str, data: bytes) -> List[PageText]:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        return _extract_pdf(data)
    if name.endswith(".txt"):
        return _extract_txt(data)
    raise DocumentProcessingError("Unsupported file type. Upload a PDF or TXT document.")


def _extract_pdf(data: bytes) -> List[PageText]:
    try:
        from pypdf import PasswordType, PdfReader
        from pypdf.errors import DependencyError, PdfReadError
    except ImportError as exc:  # pragma: no cover - dependency is in requirements.txt
        raise DocumentProcessingError("PDF support is not installed (pypdf).") from exc

    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            # Manufacturer manuals are often encrypted only to restrict editing/printing and
            # open in any PDF viewer without a password. Try that empty password, as viewers do.
            if reader.decrypt("") == PasswordType.NOT_DECRYPTED:
                raise DocumentProcessingError(
                    "This PDF needs a password to open. Open it with its password, save an "
                    "unprotected copy, and upload that copy.")
        pages = []
        for idx, page in enumerate(reader.pages, start=1):
            pages.append(PageText(page_number=idx, text=page.extract_text() or ""))
        return pages
    except DocumentProcessingError:
        raise
    except (NotImplementedError, DependencyError) as exc:
        # e.g. certificate/DRM protection pypdf cannot open
        raise DocumentProcessingError(
            f"This PDF uses protection that cannot be read ({exc}). Upload an unprotected copy.") from exc
    except (PdfReadError, ValueError, KeyError, TypeError) as exc:
        raise DocumentProcessingError(f"The PDF could not be read: {exc}") from exc


def _extract_txt(data: bytes) -> List[PageText]:
    try:
        text = data.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = data.decode("latin-1")
    # Form-feed characters mark page breaks in text exports of manuals.
    raw_pages = text.split("\f")
    return [PageText(page_number=i, text=p) for i, p in enumerate(raw_pages, start=1)]


# ---------------------------------------------------------------- headings

_NUMBERED_HEADING = re.compile(r"^(?:section\s+|chapter\s+)?\d{1,2}(?:\.\d{1,2}){0,3}\.?\s+[A-Za-z].{1,80}$", re.IGNORECASE)
_LIST_ITEM = re.compile(r"^\s*(?:\d{1,2}[.)]|[-•*])\s+")


def is_heading(line: str) -> bool:
    s = line.strip()
    if len(s) < 3 or len(s) > 90:
        return False
    if s.startswith("#"):
        return True
    if s.endswith((".", ",", ";")):
        return False
    if _NUMBERED_HEADING.match(s) and not re.match(r"^\d{1,2}[.)]\s", s):
        # "3.2 Alarm Messages" is a heading; "1. Check the cable" is a list step.
        return True
    letters = [c for c in s if c.isalpha()]
    if len(letters) >= 4 and all(c.isupper() for c in letters) and len(s.split()) <= 10:
        return True
    return False


def _clean_heading(line: str) -> str:
    return line.strip().lstrip("#").strip()[:255]


# ---------------------------------------------------------------- chunking

def _split_long(text: str, size: int) -> List[str]:
    """Split an over-long block on line, then sentence, boundaries."""
    if len(text) <= size:
        return [text]
    parts: List[str] = []
    buf = ""
    pieces = re.split(r"(?<=[.!?])\s+|\n", text)
    for piece in pieces:
        piece = piece.strip()
        if not piece:
            continue
        while len(piece) > size:  # pathological: no punctuation at all
            parts.append(piece[:size])
            piece = piece[size:]
        if buf and len(buf) + 1 + len(piece) > size:
            parts.append(buf)
            buf = piece
        else:
            buf = f"{buf} {piece}".strip() if buf else piece
    if buf:
        parts.append(buf)
    return parts


def _overlap_tail(text: str, overlap: int) -> str:
    if overlap <= 0 or len(text) <= overlap:
        return ""
    tail = text[-overlap:]
    space = tail.find(" ")
    return tail[space + 1:] if 0 <= space < len(tail) - 1 else tail


def _blocks(page_text: str) -> List[str]:
    """Group lines into blocks; headings and list items become their own lines."""
    blocks: List[str] = []
    current: List[str] = []
    for raw in page_text.splitlines():
        line = raw.rstrip()
        if not line.strip():
            if current:
                blocks.append("\n".join(current))
                current = []
            continue
        if is_heading(line):
            if current:
                blocks.append("\n".join(current))
                current = []
            blocks.append(line)
            continue
        current.append(line.strip())
    if current:
        blocks.append("\n".join(current))
    return blocks


def chunk_pages(pages: List[PageText], chunk_size: int = 900, overlap: int = 150) -> List[ChunkData]:
    """Chunk page by page so every chunk maps to exactly one page number.

    A new chunk starts at every section heading; long sections are split with
    `overlap` characters carried forward so sentences are not lost at boundaries."""
    if chunk_size < 200:
        raise ValueError("chunk_size must be at least 200 characters")
    overlap = max(0, min(overlap, chunk_size // 2))

    chunks: List[ChunkData] = []
    heading: Optional[str] = None

    def emit(page_no: int, text: str, section: Optional[str]):
        text = text.strip()
        if len(text) < 20 and not extract_error_codes(text):
            return
        codes = extract_error_codes(f"{section or ''}\n{text}")
        chunks.append(ChunkData(
            chunk_index=len(chunks),
            page_number=page_no,
            section_heading=section,
            content=text,
            error_codes=serialize_codes(codes),
        ))

    for page in pages:
        buf = ""
        buf_heading = heading
        for block in _blocks(page.text):
            if "\n" not in block and is_heading(block):
                if buf.strip():
                    emit(page.page_number, buf, buf_heading)
                heading = _clean_heading(block)
                buf, buf_heading = "", heading
                continue
            for piece in _split_long(block, chunk_size):
                candidate = f"{buf}\n{piece}" if buf else piece
                if len(candidate) > chunk_size and buf.strip():
                    emit(page.page_number, buf, buf_heading)
                    tail = _overlap_tail(buf, overlap)
                    buf = f"{tail}\n{piece}" if tail else piece
                    buf_heading = heading
                else:
                    buf = candidate
        if buf.strip():
            emit(page.page_number, buf, buf_heading)
    return chunks


def process_document(filename: str, data: bytes, chunk_size: int, overlap: int) -> ProcessedDocument:
    pages = extract_pages(filename, data)
    if not any(p.text.strip() for p in pages):
        raise DocumentProcessingError(
            "No extractable text found. Scanned/image-only PDFs need OCR before upload."
        )
    chunks = chunk_pages(pages, chunk_size=chunk_size, overlap=overlap)
    if not chunks:
        raise DocumentProcessingError("The document did not contain enough text to index.")
    return ProcessedDocument(page_count=len(pages), chunks=chunks)
