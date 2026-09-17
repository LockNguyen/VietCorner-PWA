"""
What it does:  Loads the chunks of every PDF, and their embeddings for a given model, caching one vector
               file per model on disk.
Concept:       Embedding the whole corpus is the expensive step (~7 minutes for 533 chunks on CPU), and its
               result only changes when the documents, the chunking settings, or the model change. Caching it
               turns a 21-minute three-model bake-off into a few seconds on every re-run.
Why this design: One module owns the cache key, so `run_eval.py` and `explain.py` can never disagree about
               which file belongs to which configuration. The key contains everything that would change the
               vectors: model name, number of chunks, chunk size and overlap. A configuration change
               therefore produces a different file name instead of silently reusing stale vectors.
Inputs/Outputs: PDFs in data/ -> list[Chunk] and a NumPy array of shape (number of chunks, model dimension).
Common pitfalls:
  - Trusting a cache across a code change. If you change how text is extracted or cleaned, the chunk count
    may stay the same while the text differs: delete evaluation/.cache to be safe.
  - Committing the cache. It is large and regenerable, so it is in .gitignore.
"""

import numpy as np

from config import CHUNK_OVERLAP_WORDS, CHUNK_WORDS, DATA_DIR, EMBEDDING_MODEL, SERVICE_ROOT
from domain import Chunk
from ingest.chunk import chunk_pages
from ingest.extract import extract_pages
from rag.embeddings import embed_passages

CACHE_DIR = SERVICE_ROOT / "evaluation" / ".cache"


def load_chunks() -> list[Chunk]:
    """Every PDF in data/, extracted and chunked with the current settings."""
    return chunk_pages([page for pdf_path in sorted(DATA_DIR.glob("*.pdf")) for page in extract_pages(pdf_path)])


def cache_path(model_name: str, chunk_count: int):
    """File name that encodes every setting the vectors depend on."""
    safe_model_name = model_name.replace("/", "_")
    return CACHE_DIR / f"{safe_model_name}__{chunk_count}chunks_{CHUNK_WORDS}w_{CHUNK_OVERLAP_WORDS}o.npy"


def load_chunk_vectors(chunks: list[Chunk], model_name: str = EMBEDDING_MODEL) -> np.ndarray:
    """Embeddings for these chunks, from the cache when possible, otherwise computed once and saved."""
    path = cache_path(model_name, len(chunks))
    if path.exists():
        return np.load(path)

    print(f"embedding {len(chunks)} chunks with {model_name} (minutes, cached afterwards in {path.name}) ...", flush=True)
    vectors = np.array(embed_passages([chunk.text for chunk in chunks], model_name))
    CACHE_DIR.mkdir(exist_ok=True)
    np.save(path, vectors)
    return vectors
