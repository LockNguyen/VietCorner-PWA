"""
What it does:  Inspects what ingestion actually put in Postgres, and proves the database search path agrees
               with the in-memory path that M3 measured.
Concept:       M3 scored retrieval with NumPy in memory. M4 moved the same search into Postgres with pgvector.
               Those are two different implementations of one idea, so the useful question is not "does the
               database return something" but "does it return the SAME thing". A parity check answers that.
Why this design: Read-only. It never writes or deletes, so it is safe to run against the real corpus at any
               time. Automated assertions live in tests/test_store.py; this file is for looking.
Inputs/Outputs: document_chunks + questions.jsonl -> a printed report. Nothing is modified.
Run:           python -m evaluation.check_database            (the first 3 questions)
               python -m evaluation.check_database --all
Common pitfalls:
  - Comparing against a stale vector cache: if you re-ingested with different chunk settings, delete
    evaluation/.cache first, or the "in memory" column describes an older corpus.
  - Reading similarity values as absolutes. They are only comparable within one model.
"""

import sys
import time

import numpy as np

from config import EMBEDDING_MODEL, TOP_K
from evaluation.corpus import load_chunk_vectors, load_chunks
from evaluation.run_eval import load_questions, rank_chunks
from rag.embeddings import embed_query
from rag.store import connect, search_chunks


def report_contents(connection) -> None:
    """Row counts, page coverage and duplicate detection, per document."""
    rows = connection.execute(
        """
        SELECT document, count(*) AS chunks, count(distinct page_number) AS pages,
               min(chunk_index) AS first_index, max(chunk_index) AS last_index,
               count(*) - count(distinct chunk_index) AS duplicate_indexes
        FROM document_chunks GROUP BY document ORDER BY document
        """
    ).fetchall()

    if not rows:
        print("document_chunks is EMPTY. Run: python -m ingest.run_ingest")
        return

    print(f"{'document':<45}{'chunks':<9}{'pages':<8}{'index range':<14}duplicates")
    for document, chunks, pages, first_index, last_index, duplicates in rows:
        print(f"{document[:44]:<45}{chunks:<9}{pages:<8}{f'{first_index}-{last_index}':<14}{duplicates}")

    # The chunk_index range must cover every row exactly once: a gap means a lost insert.
    for document, chunks, _, first_index, last_index, duplicates in rows:
        expected = last_index - first_index + 1
        if chunks != expected or duplicates:
            print(f"  WARNING {document}: {chunks} rows but indexes {first_index}-{last_index} "
                  f"({expected} expected), {duplicates} duplicate indexes")


def compare_with_memory(connection, question_count: int | None) -> None:
    """Run questions through both paths and show where the database and NumPy disagree."""
    questions = load_questions()
    if question_count is not None:
        questions = questions[:question_count]

    chunks = load_chunks()
    chunk_matrix = load_chunk_vectors(chunks)

    print(f"\nmodel {EMBEDDING_MODEL} | top {TOP_K} | {len(questions)} questions")
    print(f"\n{'#':<4}{'embed ms':<10}{'search ms':<11}{'database pages':<26}{'in-memory pages':<26}match")
    print("-" * 100)

    embed_latencies, search_latencies, matches = [], [], 0
    for index, question in enumerate(questions):
        start = time.perf_counter()
        query_vector = embed_query(question.question)
        embed_latencies.append((time.perf_counter() - start) * 1000)

        start = time.perf_counter()
        from_database = search_chunks(connection, query_vector, TOP_K)
        search_latencies.append((time.perf_counter() - start) * 1000)

        from_memory = rank_chunks(np.array(query_vector), chunk_matrix, chunks, TOP_K)
        database_pages = [result.chunk.page_number for result in from_database]
        memory_pages = [result.chunk.page_number for result in from_memory]
        same = database_pages == memory_pages
        matches += same
        print(f"{index:<4}{embed_latencies[-1]:<10.0f}{search_latencies[-1]:<11.0f}"
              f"{str(database_pages):<26}{str(memory_pages):<26}{'yes' if same else 'NO'}")

    print("-" * 100)
    print(f"identical top-{TOP_K} for {matches} of {len(questions)} questions")
    print(f"embed  p50 {np.percentile(embed_latencies, 50):.0f} ms | p95 {np.percentile(embed_latencies, 95):.0f} ms")
    print(f"search p50 {np.percentile(search_latencies, 50):.0f} ms | p95 {np.percentile(search_latencies, 95):.0f} ms")
    print("(search includes the round trip to Supabase, so it also measures your network.)")


def show_answers(connection, question_count: int) -> None:
    """Print the retrieved text itself, so you can judge whether the rows make sense."""
    for question in load_questions()[:question_count]:
        print("\n" + "=" * 100)
        print(f"{question.question}  [{'answerable' if question.is_answerable else 'unanswerable'}]")
        if question.is_answerable:
            print(f"gold pages: {list(question.pages)}")
        for rank, result in enumerate(search_chunks(connection, embed_query(question.question), TOP_K), start=1):
            marker = "*" if result.chunk.page_number in set(question.pages) else " "
            print(f"  {marker} {rank}. p.{result.chunk.page_number:<4} sim {result.similarity:.3f}  "
                  f"{result.chunk.text[:110]}")


def main(argv: list[str]) -> None:
    question_count = None if "--all" in argv else 3
    with connect() as connection:
        report_contents(connection)
        compare_with_memory(connection, question_count)
        show_answers(connection, question_count or 3)


if __name__ == "__main__":
    main(sys.argv[1:])
