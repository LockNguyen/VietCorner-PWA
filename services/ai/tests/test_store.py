"""
M4: the database path.

Marked `db` (needs DATABASE_URL and the schema from schema.sql) and `slow` (loads the embedding model), so
the everyday `pytest` run stays offline and fast.

    pytest -m db

The test ingests a throwaway document built from the synthetic sample PDF, so it never touches, counts, or
deletes your real church documents. The rows are removed again when the module finishes.
"""

from dataclasses import replace

import pytest

from domain import EmbeddedChunk
from ingest.chunk import chunk_pages
from ingest.extract import extract_pages
from rag.embeddings import embed_passages, embed_query
from rag.store import connect, replace_document_chunks, search_chunks

pytestmark = [pytest.mark.db, pytest.mark.slow]

# A name no real PDF can have, so this test can only ever affect its own rows.
TEST_DOCUMENT = "pytest_sample_policy.pdf"


def count_rows(connection, document: str) -> int:
    return connection.execute(
        "SELECT count(*) FROM document_chunks WHERE document = %s", (document,)
    ).fetchone()[0]


@pytest.fixture(scope="module")
def connection():
    with connect() as open_connection:
        yield open_connection
        with open_connection.transaction():
            open_connection.execute("DELETE FROM document_chunks WHERE document = %s", (TEST_DOCUMENT,))


@pytest.fixture(scope="module")
def embedded_chunks(sample_pdf) -> list[EmbeddedChunk]:
    """The sample PDF, chunked and embedded once, relabelled under the throwaway document name."""
    chunks = [replace(chunk, document=TEST_DOCUMENT) for chunk in chunk_pages(extract_pages(sample_pdf))]
    vectors = embed_passages([chunk.text for chunk in chunks])
    return [EmbeddedChunk(chunk, vector) for chunk, vector in zip(chunks, vectors)]


def test_ingesting_twice_leaves_the_same_rows(connection, embedded_chunks):
    """Re-ingestion must replace a document, not append to it."""
    replace_document_chunks(connection, TEST_DOCUMENT, embedded_chunks)
    after_first = count_rows(connection, TEST_DOCUMENT)

    replace_document_chunks(connection, TEST_DOCUMENT, embedded_chunks)
    after_second = count_rows(connection, TEST_DOCUMENT)

    assert after_first == len(embedded_chunks)
    assert after_second == after_first


def test_search_returns_the_page_that_answers_ordered_by_similarity(connection, embedded_chunks):
    """A question only the sample document can answer must retrieve the sample document's page."""
    replace_document_chunks(connection, TEST_DOCUMENT, embedded_chunks)

    # "Giving receipts" appears on page 4 of the sample PDF and nowhere in the church course.
    results = search_chunks(connection, embed_query("When are giving receipts for taxes mailed?"), k=5)

    assert results, "search returned nothing: is the table empty?"
    similarities = [result.similarity for result in results]
    assert similarities == sorted(similarities, reverse=True), "rows must come back most similar first"

    from_sample = [result for result in results if result.chunk.document == TEST_DOCUMENT]
    assert from_sample, "the sample document was not retrieved at all"
    assert from_sample[0].chunk.page_number == 4
    assert 0.0 < from_sample[0].similarity <= 1.0


def test_metadata_survives_the_round_trip(connection, embedded_chunks):
    """What goes into Postgres must come back out unchanged, or citations would be wrong."""
    replace_document_chunks(connection, TEST_DOCUMENT, embedded_chunks)
    original = embedded_chunks[0].chunk

    row = connection.execute(
        "SELECT document, page_number, chunk_index, text FROM document_chunks "
        "WHERE document = %s AND chunk_index = %s",
        (TEST_DOCUMENT, original.chunk_index),
    ).fetchone()

    assert row == (original.document, original.page_number, original.chunk_index, original.text)
