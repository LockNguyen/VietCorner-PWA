"""M1: chunking."""

import pytest

from domain import Page
from ingest.chunk import chunk_pages, split_with_overlap

WORDS = [f"w{i}" for i in range(10)]


def test_windows_slide_forward_by_size_minus_overlap():
    assert split_with_overlap(WORDS, size=4, overlap=1) == [WORDS[0:4], WORDS[3:7], WORDS[6:10]]


def test_input_shorter_than_size_gives_one_window():
    assert split_with_overlap(WORDS[:3], size=4, overlap=1) == [WORDS[:3]]


def test_no_extra_window_after_reaching_the_end():
    # [w0..w3], [w3..w6] already covers all 7 words, so a third window would add nothing new.
    assert split_with_overlap(WORDS[:7], size=4, overlap=1) == [WORDS[0:4], WORDS[3:7]]


def test_empty_input_gives_no_windows():
    assert split_with_overlap([], size=4, overlap=1) == []


@pytest.mark.parametrize("size, overlap", [(4, 4), (4, 5), (0, 0)])
def test_invalid_size_or_overlap_is_rejected(size, overlap):
    with pytest.raises(ValueError):
        split_with_overlap(WORDS, size, overlap)


def test_chunk_pages_numbers_chunks_per_document_and_keeps_page_numbers():
    pages = [Page("a.pdf", 1, " ".join(WORDS)), Page("a.pdf", 2, "x y"), Page("b.pdf", 1, "z")]

    chunks = chunk_pages(pages, size=4, overlap=1)

    assert [(c.document, c.page_number, c.chunk_index) for c in chunks] == [
        ("a.pdf", 1, 0),
        ("a.pdf", 1, 1),
        ("a.pdf", 1, 2),
        ("a.pdf", 2, 3),
        ("b.pdf", 1, 0),
    ]
    assert chunks[0].text == "w0 w1 w2 w3"
