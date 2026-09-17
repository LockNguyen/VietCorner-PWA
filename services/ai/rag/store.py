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
    # Fail loudly: with an empty string psycopg quietly falls back to localhost and times out there,
    # which looks like a network problem instead of a missing setting.
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is empty. Copy Supabase's 'Session pooler' connection string into services/ai/.env"
        )

    connection = psycopg.connect(DATABASE_URL)
    register_vector(connection)
    return connection


def replace_document_chunks(
    connection: psycopg.Connection, document: str, embedded: list[EmbeddedChunk]
) -> None:
    """Replace all stored chunks of one document (idempotent re-ingestion).
    """
    with connection.transaction():
        cursor = connection.cursor()
        cursor.execute("DELETE FROM document_chunks WHERE document = %s", (document,))

        replacement_chunks = [
            (
                item.chunk.document,
                item.chunk.page_number,
                item.chunk.chunk_index,
                item.chunk.text,
                np.array(item.embedding),
            )
            for item in embedded
        ]

        cursor.executemany(
            "INSERT INTO document_chunks "
            "(document, page_number, chunk_index, text, embedding) "
            "VALUES (%s, %s, %s, %s, %s)",
            replacement_chunks,
        )


def search_chunks(
    connection: psycopg.Connection, query_embedding: list[float], k: int = TOP_K
) -> list[RetrievedChunk]:
    """Return the k chunks closest to the query, most similar first.
    """
    cursor = connection.cursor()

    query_vector = np.array(query_embedding)
    rows = cursor.execute(
        """
        SELECT document, page_number, chunk_index, text, 1 - (embedding <=> %s) AS similarity
        FROM document_chunks
        ORDER BY embedding <=> %s
        LIMIT %s
        """,
        (query_vector, query_vector, k),
    ).fetchall()

    return [
        RetrievedChunk(
            chunk=Chunk(
                document=document,
                page_number=page_number,
                chunk_index=chunk_index,
                text=text,
            ),
            similarity=float(similarity),
        )
        for document, page_number, chunk_index, text, similarity in rows
    ]
