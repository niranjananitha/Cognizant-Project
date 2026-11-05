"""Unit tests: text extraction, chunking, error-code handling, safety filter."""
import pytest

from app.rag.document_processor import (
    DocumentProcessingError, chunk_pages, extract_pages, is_heading, process_document, PageText,
)
from app.rag.error_codes import chunk_contains_code, extract_error_codes, normalize_error_code
from app.rag.nurse_assistant import _extract_list_items
from app.rag.safety import check_step_safety, is_safety_critical
from rag_fixtures import V60_MANUAL, make_pdf


def test_pdf_text_extraction_preserves_pages():
    pdf = make_pdf(["PAGE ONE HEADING\nAlpha content line.", "SECTION 4 ALARMS\nE05 LOW BATTERY\n1. Check the AC cord."])
    pages = extract_pages("manual.pdf", pdf)
    assert [p.page_number for p in pages] == [1, 2]
    assert "Alpha content line" in pages[0].text
    assert "E05 LOW BATTERY" in pages[1].text


def test_txt_form_feed_marks_pages():
    pages = extract_pages("manual.txt", V60_MANUAL.encode())
    assert len(pages) == 3
    assert "E05 LOW BATTERY" in pages[1].text


def test_unsupported_file_type_rejected():
    with pytest.raises(DocumentProcessingError):
        extract_pages("manual.docx", b"data")


def test_image_only_document_fails_processing():
    with pytest.raises(DocumentProcessingError):
        process_document("blank.txt", b"   \n\f  ", 900, 150)


def test_chunks_keep_page_numbers_headings_and_codes():
    processed = process_document("manual.txt", V60_MANUAL.encode(), 900, 150)
    assert processed.page_count == 3
    by_heading = {c.section_heading: c for c in processed.chunks}
    e05 = by_heading["E05 LOW BATTERY"]
    assert e05.page_number == 2
    assert " E5 " in e05.error_codes
    assert "AC power cord" in e05.content
    power_on = by_heading["2.1 Power On"]
    assert power_on.page_number == 3
    assert [c.chunk_index for c in processed.chunks] == list(range(len(processed.chunks)))


def test_long_sections_split_with_overlap():
    sentences = " ".join(f"Sentence number {i} describes the ventilator display panel." for i in range(60))
    chunks = chunk_pages([PageText(1, "OPERATION\n" + sentences)], chunk_size=300, overlap=80)
    assert len(chunks) > 3
    assert all(len(c.content) <= 300 + 80 for c in chunks)
    # overlap: the start of chunk 2 repeats text from the end of chunk 1
    tail_words = chunks[0].content.split()[-3:]
    assert " ".join(tail_words) in chunks[1].content


def test_heading_detection():
    assert is_heading("SECTION 4 ALARMS AND ERROR CODES")
    assert is_heading("2.1 Power On")
    assert not is_heading("1. Check the AC cord.")
    assert not is_heading("The internal battery is low.")


@pytest.mark.parametrize("raw,expected", [
    ("E05", "E5"), ("e-5", "E5"), ("E 05", "E5"), ("ERR 102", "ERR102"),
    ("Alarm 012", "ALM12"), ("low batt", "LOW BATT"), ("", None), (None, None),
])
def test_error_code_normalisation(raw, expected):
    assert normalize_error_code(raw) == expected


def test_error_code_extraction_and_matching():
    codes = extract_error_codes("Codes E05, ERR-102 and ALARM 7 apply.")
    assert codes == {"E5", "ERR102", "ALM7"}
    assert chunk_contains_code("E5", " E5 ", "")
    assert not chunk_contains_code("E6", " E5 ", "")
    assert chunk_contains_code("LOW BATT", None, "Message LOW-BATT is shown")


def test_list_item_extraction_is_verbatim():
    text = "1. Check the cord.\n2. Confirm the indicator\nis lit.\nIf it persists, call biomed."
    assert _extract_list_items(text) == ["Check the cord.", "Confirm the indicator is lit."]


@pytest.mark.parametrize("text,allowed", [
    ("Check that the AC power cord is connected.", True),
    ("Do not open the ventilator housing.", True),
    ("Remove the rear cover and replace the internal fuse.", False),
    ("Disable the high pressure alarm to stop the noise.", False),
    ("Increase the tidal volume to 500 ml.", False),
    ("Enter service mode and run calibration.", False),
    ("Never use sharp tools. Open the housing to inspect the board.", False),
])
def test_safety_filter(text, allowed):
    assert check_step_safety(text)[0] is allowed


def test_safety_critical_detection():
    assert is_safety_critical("There is smoke coming from the unit")
    assert not is_safety_critical("How do I turn on the ventilator?")
