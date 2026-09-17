"""
What it does:  The offline recipe. For every PDF in data/: extract -> chunk -> embed -> save to Postgres.
Concept:       Ingestion prepares knowledge ahead of time so each question only needs one fast vector search.
               It must be idempotent: running it twice gives the same database, not duplicate chunks.
Why this design: An orchestrator with no logic of its own. Each step is one call to a tested function, so
               the file reads like the pipeline diagram. Replacing a document's chunks (delete + insert in
               one transaction) makes re-runs safe.
Inputs/Outputs: PDFs in config.DATA_DIR -> rows in document_chunks. Prints a summary per document.
Run:           python -m ingest.run_ingest
Common pitfalls:
  - Embedding chunks one at a time (slow). Pass the whole list to embed_passages so the model batches.
  - Forgetting to re-run ingestion after changing CHUNK_WORDS or EMBEDDING_MODEL.
"""

from config import DATA_DIR
from domain import EmbeddedChunk
from ingest.chunk import chunk_pages
from ingest.extract import extract_pages
from rag.embeddings import embed_passages
from rag.store import connect, replace_document_chunks


def ingest_all() -> None:
    """Ingest every PDF in DATA_DIR.
    """
    pdf_paths = sorted(DATA_DIR.glob("*.pdf"))

    if len(pdf_paths) == 0:
        raise ValueError(
            "There are no PDFs to process. Please put them in the /data folder."
        )

    for pdf_path in pdf_paths:
        pages = extract_pages(pdf_path)
        chunks = chunk_pages(pages)
        vectors = embed_passages([chunk.text for chunk in chunks])
        embedded = [
            EmbeddedChunk(chunk, vector) for chunk, vector in zip(chunks, vectors)
        ]
        replace_document_chunks(connect(), pdf_path.name, embedded)
        print(f"{pdf_path.name}: {len(pages)} pages -> {len(chunks)} chunks")


if __name__ == "__main__":
    ingest_all()
