"""
What it does:  Splits pages into overlapping chunks of words.
Concept:       Embedding models summarize a text into ONE vector. A whole page mixes many topics, so its vector
               is a blurry average and matches questions poorly. Small chunks each cover one idea, so their
               vectors are sharp. Overlap keeps a sentence that crosses a boundary intact in at least one chunk.
Why this design: Fixed-size sliding windows are the simplest strong baseline. Both functions are pure
               (no I/O), so they're fully unit-tested. Chunks never cross pages, so every chunk has one exact
               page number to cite.
Inputs/Outputs: list[Page] -> list[Chunk]
Common pitfalls:
  - overlap >= size means the window never moves forward (infinite loop). Reject it.
  - Emitting a final window that only repeats words already covered by the previous one.
  - Resetting chunk_index per page instead of per document, which creates duplicate ids.
Questions:
  - Why not chunk by each paragraph (or half if it exceeds a max length)?
  - Overlap so we don't break a sentence apart in two different chunks. But chunks never cross pages. What if a sentence cross pages?
"""

from config import CHUNK_OVERLAP_WORDS, CHUNK_WORDS
from domain import Chunk, Page


def split_with_overlap(words: list[str], size: int, overlap: int) -> list[list[str]]:
    """Slide a window of `size` words forward by (size - overlap) words at a time.

    Example: 10 words, size=4, overlap=1 -> windows start at 0, 3, 6 -> [w0..w3], [w3..w6], [w6..w9]
    Stop as soon as a window reaches the last word. Never emit a window that adds nothing new.
    """
    if overlap >= size or size <= 0:
        raise ValueError("'overlap' must be less than 'size', and 'sỉze' must be greater than 0. Otherwise, the chunking sliding window never moves forward.")

    if len(words) == 0:
        return []

    splits = []
    start = 0
    step = size - overlap

    while True:
        splits.append(words[start : start + size])

        # Stop if this is the last window (already covers up everything up to 'end')
        if start + size >= len(words):
            break
        
        start += step

    return splits

def chunk_pages(pages: list[Page], size: int = CHUNK_WORDS, overlap: int = CHUNK_OVERLAP_WORDS) -> list[Chunk]:
    """Turn pages into chunks, numbering chunk_index 0, 1, 2, ... across each document.
    """
    chunks = []
    chunk_indices = {}
    
    for page in pages:
        if page.document not in chunk_indices:
            chunk_indices[page.document] = 0

        words = page.text.split()
        windows = split_with_overlap(words, size, overlap)
        for window in windows:
            chunks.append(Chunk(document=page.document, page_number=page.page_number,
                                chunk_index=chunk_indices[page.document], text=" ".join(window)))
            chunk_indices[page.document] += 1

    return chunks