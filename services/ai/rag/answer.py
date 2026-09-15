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


def search_with_new_connection(query_embedding: list[float], k: int = TOP_K) -> list[RetrievedChunk]:
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
    """Answer a question from the documents.

    TODO(M5):
      1. timings = {}. Around each step, measure with time.perf_counter() and store milliseconds:
         timings["embed_ms"], timings["search_ms"], and (if called) timings["generate_ms"].
      2. query_vector = embed(question)
      3. chunks = search(query_vector)
      4. relevant = [c for c in chunks if c.similarity >= SIMILARITY_FLOOR]
      5. If relevant is empty: return Answer(NOT_FOUND_TEXT, [], timings). Do NOT call generate.
      6. text = generate(build_prompt(question, relevant))
      7. sources = [Source(c.chunk.document, c.chunk.page_number, c.similarity) for c in relevant]
         (Keep the same order as the prompt, so citation [1] is sources[0].)
      8. Return Answer(text, sources, timings).
    """
    raise NotImplementedError("M5: implement answer_question")


if __name__ == "__main__":
    result = answer_question(" ".join(sys.argv[1:]))
    print(result.text, "\n")
    for number, source in enumerate(result.sources, start=1):
        print(f"[{number}] {source.document}, page {source.page_number} (similarity {source.similarity:.2f})")
    print("\n", {name: round(ms) for name, ms in result.timings.items()})
