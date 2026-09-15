"""M5: the RAG recipe, tested with fakes (no model, database, or network)."""

from config import SIMILARITY_FLOOR
from domain import Chunk, RetrievedChunk
from rag.answer import NOT_FOUND_TEXT, answer_question

BELOW_FLOOR = SIMILARITY_FLOOR - 0.1


def fake_embed(text: str) -> list[float]:
    return [1.0, 0.0]


def fake_search_returning(similarities: list[float]):
    """A search step that returns one chunk per similarity, on pages 1, 2, 3, ..."""

    def search(query_vector: list[float]) -> list[RetrievedChunk]:
        return [
            RetrievedChunk(Chunk("doc.pdf", index + 1, index, f"text {index}"), similarity)
            for index, similarity in enumerate(similarities)
        ]

    return search


class FakeGenerate:
    """Records the messages it receives, so tests can inspect the prompt."""

    def __init__(self) -> None:
        self.calls: list[list[dict[str, str]]] = []

    def __call__(self, messages: list[dict[str, str]]) -> str:
        self.calls.append(messages)
        return "Yes [1]."


def test_refuses_without_calling_the_llm_when_no_chunk_is_relevant():
    generate = FakeGenerate()

    answer = answer_question("q", embed=fake_embed, search=fake_search_returning([BELOW_FLOOR]), generate=generate)

    assert answer.text == NOT_FOUND_TEXT
    assert answer.sources == []
    assert generate.calls == []


def test_uses_only_relevant_chunks_as_sources_in_prompt_order():
    generate = FakeGenerate()

    answer = answer_question("q", embed=fake_embed, search=fake_search_returning([0.9, 0.7, BELOW_FLOOR]), generate=generate)

    assert answer.text == "Yes [1]."
    assert [(source.page_number, source.similarity) for source in answer.sources] == [(1, 0.9), (2, 0.7)]
    assert "text 2" not in generate.calls[0][1]["content"]  # the irrelevant chunk never reaches the LLM


def test_records_a_timing_for_every_stage():
    answer = answer_question("q", embed=fake_embed, search=fake_search_returning([0.9]), generate=FakeGenerate())

    assert set(answer.timings) == {"embed_ms", "search_ms", "generate_ms"}
    assert all(milliseconds >= 0 for milliseconds in answer.timings.values())
