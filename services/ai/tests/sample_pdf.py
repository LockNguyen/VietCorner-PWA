"""
Generates a small, synthetic, bilingual "church policy" PDF for tests.
Why generated instead of committed: no binary files in git, no private church data, and anyone can read
exactly what the test document contains (SAMPLE_PAGES below).
Page 3 is intentionally blank, so tests can check that blank pages are skipped but page numbers are kept.
"""

from pathlib import Path

import pymupdf

SAMPLE_PAGES = [
    "Volunteer Policy. Volunteers who work with children must complete a background check "
    "before their first day of service. Background checks are renewed every two years.",
    "Chính sách tình nguyện viên. Tình nguyện viên làm việc với trẻ em phải hoàn tất kiểm tra lý lịch "
    "trước ngày phục vụ đầu tiên. Việc kiểm tra lý lịch được thực hiện lại mỗi hai năm.",
    "",  # blank page
    "Dâng hiến và biên nhận. Nhà thờ gửi biên nhận dâng hiến để khai thuế vào tháng Giêng mỗi năm. "
    "Giving receipts for taxes are mailed every January.",
]


def make_sample_pdf(path: Path) -> Path:
    """Write SAMPLE_PAGES to a PDF at path and return the path."""
    with pymupdf.open() as pdf:
        for text in SAMPLE_PAGES:
            page = pdf.new_page()
            if text:
                # insert_htmlbox chooses fonts that contain Vietnamese letters. The default font of plain
                # insert_text cannot draw characters like "ệ".
                page.insert_htmlbox(pymupdf.Rect(50, 50, 545, 792), f"<p>{text}</p>")
        pdf.save(path)
    return path
