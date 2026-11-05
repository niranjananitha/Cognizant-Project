"""Error-code extraction and normalisation.

Manuals write the same code many ways ("E05", "E-05", "e5", "Error 12", "ALM-305").
Codes are normalised to PREFIX + integer, e.g. "E05" -> "E5", "Alarm 012" -> "ALM12",
so a nurse typing the code from the device screen matches the manual entry."""
import re
from typing import Optional, Set

# Single-letter prefixes must be attached or hyphenated (E05, E-05) to avoid matching
# prose like "step A 1"; multi-letter prefixes may be separated by a space (ERR 102).
_CODE_PATTERN = re.compile(
    r"\b(?:"
    r"(?P<p1>ERROR|ERR|ALARM|ALM|FAULT|FLT|WARN|WRN|CODE)[\s\-:#]?(?P<d1>\d{1,4})"
    r"|"
    r"(?P<p2>[EAFWC])-?(?P<d2>\d{1,4})"
    r")\b",
    re.IGNORECASE,
)

_PREFIX_ALIASES = {
    "ERROR": "ERR",
    "ALARM": "ALM",
    "FAULT": "FLT",
    "WARN": "WRN",
}


def _normalise(prefix: str, digits: str) -> str:
    prefix = prefix.upper()
    prefix = _PREFIX_ALIASES.get(prefix, prefix)
    return f"{prefix}{int(digits)}"


def normalize_error_code(raw: Optional[str]) -> Optional[str]:
    """Normalise a user-entered code. Returns None for empty input.

    Codes that do not follow a PREFIX+digits shape (e.g. "LOW BATT", "305") are
    returned upper-cased with separators collapsed so they can still be matched
    literally against manual text."""
    if raw is None:
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    # User input is typed from a device screen: tolerate "E 05" / "E-05" / "e:05".
    compact = re.sub(r"[\s\-:#]+", "", cleaned)
    m = _CODE_PATTERN.fullmatch(compact) or _CODE_PATTERN.fullmatch(cleaned)
    if m:
        if m.group("p1"):
            return _normalise(m.group("p1"), m.group("d1"))
        return _normalise(m.group("p2"), m.group("d2"))
    return re.sub(r"[\s\-_]+", " ", cleaned.upper())


def extract_error_codes(text: str) -> Set[str]:
    codes = set()
    for m in _CODE_PATTERN.finditer(text or ""):
        if m.group("p1"):
            codes.add(_normalise(m.group("p1"), m.group("d1")))
        else:
            codes.add(_normalise(m.group("p2"), m.group("d2")))
    return codes


def serialize_codes(codes: Set[str]) -> Optional[str]:
    if not codes:
        return None
    joined = " ".join(sorted(codes))
    return f" {joined[:496]} "


def chunk_contains_code(normalized_code: str, chunk_codes: Optional[str], chunk_text: str) -> bool:
    """True when the chunk documents the given (normalised) error code."""
    if not normalized_code:
        return False
    if chunk_codes and f" {normalized_code} " in chunk_codes:
        return True
    # Free-form codes (no PREFIX+digits shape): literal, word-bounded match.
    if not _CODE_PATTERN.fullmatch(normalized_code.replace(" ", "")):
        pattern = r"(?<![\w])" + re.escape(normalized_code).replace(r"\ ", r"[\s\-_]+") + r"(?![\w])"
        return re.search(pattern, chunk_text or "", re.IGNORECASE) is not None
    return False


def lines_mentioning_code(normalized_code: str, text: str):
    """Yield the verbatim lines of `text` that mention the code."""
    for line in (text or "").splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if normalized_code in extract_error_codes(stripped) or chunk_contains_code(normalized_code, None, stripped):
            yield stripped
