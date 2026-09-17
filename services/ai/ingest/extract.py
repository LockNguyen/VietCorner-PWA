"""
What it does:  Reads a PDF and returns the text of each page.
Concept:       PDFs store positioned glyphs, not paragraphs. Text extraction rebuilds readable text from them.
               Vietnamese adds a twist: a letter like "ệ" can be stored as ONE code point or as "e" plus two
               combining accent marks. Both look identical but are different strings, so searching and
               comparing break unless we normalize to one form (NFC).
Why this design: normalize_text is a pure function (easy to test). extract_pages does the file I/O and calls it.
Inputs/Outputs: Path to a PDF -> list[Page] (empty pages skipped).
Common pitfalls:
  - Scanned PDFs are images: get_text() returns "". They need OCR, a separate step.
  - Forgetting NFC normalization, so "tình nguyện" in the PDF doesn't equal "tình nguyện" typed by a user.
  - Page numbers starting at 0. Users and printed documents count from 1.
"""

import unicodedata
from pathlib import Path

import pymupdf

from domain import Page


def normalize_text(text: str) -> str:
    """Return text in Unicode NFC form with whitespace collapsed to single spaces and trimmed.

    Example: "Tình  nguyện\\n\\nviên " -> "Tình nguyện viên"
    """
    nfc_text = unicodedata.normalize("NFC", text)
    collapsed_text = " ".join(nfc_text.split())
    return collapsed_text


def extract_pages(pdf_path: Path) -> list[Page]:
    """Return one Page per non-empty PDF page, with normalized text.
    """
    pages = []
    with pymupdf.open(pdf_path) as pdf:
        for index, page in enumerate(pdf):
            raw_text = page.get_text("text")
            cleaned_text = normalize_text(raw_text)
            if cleaned_text:  # Skip empty pages
                pages.append(Page(document=pdf_path.name, page_number=index + 1, text=cleaned_text))
    return pages