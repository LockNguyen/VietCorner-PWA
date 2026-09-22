"""M7: rewriting a follow-up into a standalone question. Pure logic, tested with fakes: no keys, no network."""

import pytest

from config import MAX_CONDENSED_QUESTION_CHARS, MAX_HISTORY_CHARS_PER_TURN, MAX_HISTORY_TURNS
from domain import Generation, Turn
from rag.condense import build_condense_messages, condense_question, trim_history

CONVERSATION = [
    Turn("user", "Người bình an là ai?"),
    Turn("assistant", "Người bình an là người đón nhận Tin Lành [1]."),
]
FOLLOW_UP = "Còn nhóm khác thì sao?"


def rewriter(text: str):
    """A stand-in generator that always returns `text`, and records what it was asked."""
    calls = []

    def generate(messages, *, deadline_seconds):
        calls.append((messages, deadline_seconds))
        return Generation(text, "fake")

    generate.calls = calls
    return generate


def test_the_first_question_is_never_rewritten():
    generate = rewriter("should not be used")

    assert condense_question("Người bình an là ai?", [], generate=generate) == "Người bình an là ai?"
    assert generate.calls == [], "no history means nothing to resolve, so the call is wasted"


def test_a_follow_up_is_replaced_by_the_rewrite():
    generate = rewriter("Các nhóm Come and See có mở cho người mới không?")

    assert condense_question(FOLLOW_UP, CONVERSATION, generate=generate) == (
        "Các nhóm Come and See có mở cho người mới không?"
    )


def test_the_conversation_and_the_question_both_reach_the_model():
    generate = rewriter("rewritten")

    condense_question(FOLLOW_UP, CONVERSATION, generate=generate)
    prompt = generate.calls[0][0][1]["content"]

    assert "Người bình an là ai?" in prompt
    assert FOLLOW_UP in prompt


def test_the_rewrite_gets_its_own_short_deadline():
    generate = rewriter("rewritten")

    condense_question(FOLLOW_UP, CONVERSATION, generate=generate)

    assert generate.calls[0][1] == pytest.approx(2), "the rewrite must not eat the answer's time budget"


@pytest.mark.parametrize(
    "reply",
    ["", "   ", "x" * (MAX_CONDENSED_QUESTION_CHARS + 1)],
    ids=["empty", "blank", "too long"],
)
def test_an_untrustworthy_rewrite_falls_back_to_the_users_words(reply):
    assert condense_question(FOLLOW_UP, CONVERSATION, generate=rewriter(reply)) == FOLLOW_UP


def test_a_failing_provider_falls_back_to_the_users_words():
    def generate(messages, *, deadline_seconds):
        raise RuntimeError("every provider is busy")

    assert condense_question(FOLLOW_UP, CONVERSATION, generate=generate) == FOLLOW_UP


def test_history_is_trimmed_to_the_last_turns_and_shortened():
    long_conversation = [Turn("user", f"question {index} " + "x" * 1000) for index in range(10)]

    trimmed = trim_history(long_conversation)

    assert len(trimmed) == MAX_HISTORY_TURNS
    assert trimmed[0].text.startswith("question 6"), "the most recent turns are the ones that resolve pronouns"
    assert all(len(turn.text) <= MAX_HISTORY_CHARS_PER_TURN for turn in trimmed)


def test_the_prompt_labels_who_said_what():
    messages = build_condense_messages(FOLLOW_UP, CONVERSATION)

    assert [message["role"] for message in messages] == ["system", "user"]
    assert "user: Người bình an là ai?" in messages[1]["content"]
    assert "assistant: Người bình an là người đón nhận Tin Lành [1]." in messages[1]["content"]
