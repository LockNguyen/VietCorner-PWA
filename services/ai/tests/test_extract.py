"""M1: text extraction."""

import unicodedata

from ingest.extract import extract_pages, normalize_text


def test_normalize_text_collapses_whitespace():
    assert normalize_text("  Tình  nguyện\n\nviên \t") == "Tình nguyện viên"


def test_normalize_text_composes_vietnamese_accents():
    decomposed = unicodedata.normalize("NFD", "kiểm tra lý lịch")
    assert decomposed != "kiểm tra lý lịch"  # looks the same, but different code points
    assert normalize_text(decomposed) == "kiểm tra lý lịch"


def test_extract_pages_keeps_printed_page_numbers_and_skips_blank_pages(sample_pdf):
    pages = extract_pages(sample_pdf)
    assert [page.page_number for page in pages] == [1, 2, 4]
    assert all(page.document == "sample_policy.pdf" for page in pages)


def test_extract_pages_preserves_vietnamese_text(sample_pdf):
    vietnamese_page = extract_pages(sample_pdf)[1]
    assert "tình nguyện viên" in vietnamese_page.text.lower()
