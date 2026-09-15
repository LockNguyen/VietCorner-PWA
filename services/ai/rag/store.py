"""
What it does:  Saves chunks with their embeddings to Postgres and finds the chunks most similar to a question.
Concept:       pgvector adds a `vector` column type and distance operators to Postgres. `<=>` is cosine
               DISTANCE (0 = same direction), so similarity = 1 - distance. An HNSW index makes
               "ORDER BY embedding <=> query LIMIT k" fast without comparing against every row.
Why this design: Plain SQL you can read and run in the Supabase SQL editor. No ORM or vector framework hides
               the query. This table is server-only: browsers have no grants on it (see schema.sql).
Inputs/Outputs: EmbeddedChunk rows in -> RetrievedChunk results out.
Common pitfalls:
  - Sorting by similarity DESC instead of distance ASC. The index only accelerates ORDER BY distance.
  - Deleting and inserting outside a transaction, so a crash leaves a document half-ingested.
  - Forgetting register_vector(connection), which makes Python lists fail to convert to `vector`.
"""

import numpy as np
import psycopg
from pgvector.psycopg import register_vector

from config import DATABASE_URL, TOP_K
from domain import Chunk, EmbeddedChunk, RetrievedChunk


def connect() -> psycopg.Connection:
    """Open a Postgres connection that understands the pgvector type."""
    connection = psycopg.connect(DATABASE_URL)
    register_vector(connection)
    return connection


def replace_document_chunks(connection: psycopg.Connection, document: str, embedded: list[EmbeddedChunk]) -> None:
    """Replace all stored chunks of one document (idempotent re-ingestion).

    TODO(M4):
      1. `with connection.transaction():` so the delete and inserts succeed or fail together.
      2. DELETE FROM document_chunks WHERE document = %s
      3. For each item: INSERT INTO document_chunks (document, page_number, chunk_index, text, embedding)
         VALUES (%s, %s, %s, %s, %s). Pass numpy.array(item.embedding) for the vector parameter.
         (cursor.executemany is a tidy way to insert many rows.)
    """
    raise NotImplementedError("M4: implement replace_document_chunks")


def search_chunks(connection: psycopg.Connection, query_embedding: list[float], k: int = TOP_K) -> list[RetrievedChunk]:
    """Return the k chunks closest to the query, most similar first.

    TODO(M4):
      1. SELECT document, page_number, chunk_index, text, 1 - (embedding <=> %s) AS similarity
         FROM document_chunks ORDER BY embedding <=> %s LIMIT %s
         (pass numpy.array(query_embedding) twice, then k)
      2. Map each row to RetrievedChunk(chunk=Chunk(...), similarity=float(row similarity)).
    """
    raise NotImplementedError("M4: implement search_chunks")
