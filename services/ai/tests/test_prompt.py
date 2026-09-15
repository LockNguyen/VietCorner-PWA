"""M5: prompt construction."""

from domain import Chunk, RetrievedChunk
from rag.prompt import SYSTEM_PROMPT, build_prompt, format_sources

CHUNKS = [
    RetrievedChunk(Chunk("volunteer.pdf", 2, 0, "Volunteers need a background check."), similarity=0.82),
    RetrievedChunk(Chunk("giving.pdf", 4, 7, "Receipts are mailed in January."), similarity=0.61),
]


def test_sources_are_numbered_from_one_with_document_and_page():
    assert format_sources(CHUNKS) == (
        "[1] (volunteer.pdf, page 2)\nVolunteers need a background check.\n\n"
        "[2] (giving.pdf, page 4)\nReceipts are mailed in January."
    )


def test_rules_go_in_the_system_message_and_the_question_comes_last():
    messages = build_prompt("Do volunteers need a check?", CHUNKS)

    assert [message["role"] for message in messages] == ["system", "user"]
    assert messages[0]["content"] == SYSTEM_PROMPT
    assert format_sources(CHUNKS) in messages[1]["content"]
    assert messages[1]["content"].endswith("Question: Do volunteers need a check?")


def test_system_prompt_has_been_written():
    assert "TODO" not in SYSTEM_PROMPT
    assert len(SYSTEM_PROMPT) > 100
