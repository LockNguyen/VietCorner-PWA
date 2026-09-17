"""
What it does:  Answers one question end to end: embed -> search -> (refuse or) prompt -> generate.
Concept:       This is the whole RAG loop in one readable recipe. It also refuses early when no chunk is
               relevant enough (SIMILARITY_FLOOR). Skipping the LLM there is faster, cheaper, and prevents
               hallucinated answers.
Why this design: Dependency injection: the three I/O steps are parameters with real defaults. Tests pass
               fakes, so the recipe's logic (refusal, sources, timings) is tested without a model, database,
               or network. The same function will later be a tool for a LiveKit voice agent (M9).
Inputs/Outputs: question text -> Answer(text, sources, timings in ms).
Run:           python -m rag.answer "Tình nguyện viên cần kiểm tra lý lịch không?"
Common pitfalls:
  - Calling the LLM with zero relevant sources, which invites made-up answers.
  - Measuring time with time.time() (can jump). Use time.perf_counter() for durations.
"""

import sys
import time
from collections.abc import Callable

from config import SIMILARITY_FLOOR, TOP_K
from domain import Answer, RetrievedChunk, Source
from rag.embeddings import embed_query
from rag.generate import generate_answer
from rag.prompt import build_prompt

NOT_FOUND_TEXT = (
    "Xin lỗi, tôi không tìm thấy thông tin này trong tài liệu. "
    "Sorry, I couldn't find this in the documents."
)


def search_with_new_connection(
    query_embedding: list[float], k: int = TOP_K
) -> list[RetrievedChunk]:
    """Default search step: open a connection, search, close. (Connection pooling is a stretch exercise.)"""
    from rag.store import connect, search_chunks

    with connect() as connection:
        return search_chunks(connection, query_embedding, k)


def answer_question(
    question: str,
    *,
    embed: Callable[[str], list[float]] = embed_query,
    search: Callable[[list[float]], list[RetrievedChunk]] = search_with_new_connection,
    generate: Callable[[list[dict[str, str]]], str] = generate_answer,
) -> Answer:
    """Answer a question from the documents."""
    timings = {}

    start_time = time.perf_counter()
    query_vector = embed(question)
    end_time = time.perf_counter()
    timings["embed_ms"] = (end_time - start_time) * 1000

    start_time = time.perf_counter()
    chunks = search(query_vector)
    end_time = time.perf_counter()
    timings["search_ms"] = (end_time - start_time) * 1000

    relevant = [chunk for chunk in chunks if chunk.similarity >= SIMILARITY_FLOOR]
    if not relevant:
        return Answer(NOT_FOUND_TEXT, [], timings)

    start_time = time.perf_counter()
    text = generate(build_prompt(question, relevant))
    end_time = time.perf_counter()
    timings["generate_ms"] = (end_time - start_time) * 1000

    sources = [
        Source(
            retrieved.chunk.document, retrieved.chunk.page_number, retrieved.similarity
        )
        for retrieved in relevant
    ]

    return Answer(text, sources, timings)


def print_answer(question: str) -> None:
    """Ask one question and print the answer, its sources and its timings. Used by the CLI and by hand."""
    result = answer_question(question)
    print(result.text, "\n")
    for number, source in enumerate(result.sources, start=1):
        print(f"[{number}] {source.document}, page {source.page_number} (similarity {source.similarity:.2f})")
    print("\n", {name: round(milliseconds) for name, milliseconds in result.timings.items()})


def main(argv: list[str]) -> None:
    if not argv:
        print('Usage: python -m rag.answer "your question"')
        return
    print_answer(" ".join(argv))


if __name__ == "__main__":
    main(sys.argv[1:])
