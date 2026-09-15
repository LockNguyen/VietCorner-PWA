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

    TODO(M1):
      1. Normalize to NFC with unicodedata.normalize("NFC", text).
      2. Collapse every run of whitespace (spaces, tabs, newlines) into one space. Hint: " ".join(text.split())
      3. Return the result (split/join already trims both ends).
    """
    raise NotImplementedError("M1: implement normalize_text")


def extract_pages(pdf_path: Path) -> list[Page]:
    """Return one Page per non-empty PDF page, with normalized text.

    TODO(M1):
      1. Open the file: `with pymupdf.open(pdf_path) as pdf:`
      2. Loop with enumerate(pdf) to get each page and its 0-based index.
      3. Get raw text with page.get_text("text"), then clean it with normalize_text().
      4. Skip pages whose cleaned text is empty (blank or scanned pages).
      5. Build Page(document=pdf_path.name, page_number=index + 1, text=cleaned).
    """
    raise NotImplementedError("M1: implement extract_pages")
