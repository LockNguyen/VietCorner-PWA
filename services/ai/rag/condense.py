"""
What it does:  Rewrites a follow-up question into one that stands on its own, using the last few turns.
Concept:       Retrieval has no memory. "Còn nhóm khác thì sao?" ("What about the other group?") retrieves
               nothing, because the pronoun's meaning lived in the previous turn. So before searching, a small
               LLM call folds the history into the question: "Các nhóm Come and See có mở cho người mới không?".
               This is the standard fix for RAG chat, and it happens BEFORE embedding, not after.
Why this design: Pure prompt building (testable without a network) + one thin call with dependency injection,
               like every other stage. It fails safe: if the rewrite is empty, too long, or slow, we search with
               the user's original words, which is worse for follow-ups but never worse than not answering.
Inputs/Outputs: question + history (oldest first) -> one self-contained question.
Common pitfalls:
  - A prompt without an example. Measured 2026-09-22: with rules alone, a small model called
    "Còn nhóm khác thì sao?" self-contained and changed nothing; with one worked example it resolved it to
    "Các nhóm khác ngoài nhóm Come and See thì như thế nào?" and still left standalone questions untouched.
  - Letting the rewrite invent specifics. A hallucinated name sends retrieval chasing a page that doesn't exist,
    so we keep the prompt strict, the answer short, and fall back to the original when it looks wrong.
  - Sending the whole conversation. Old answers are long; only the last turns resolve a pronoun, so we trim.
  - Rewriting the very first question. With no history there is nothing to resolve, and the call is wasted.
"""

from typing import Protocol

from config import (
    CONDENSE_DEADLINE_SECONDS,
    MAX_CONDENSED_QUESTION_CHARS,
    MAX_HISTORY_CHARS_PER_TURN,
    MAX_HISTORY_TURNS,
)
from domain import Generation, Turn
from rag.generate import generate_answer

class Rewriter(Protocol):
    """What condense_question needs from a generator: messages in, one short answer out, within a deadline."""

    def __call__(self, messages: list[dict[str, str]], *, deadline_seconds: float) -> Generation: ...


CONDENSE_PROMPT = """You rewrite a follow-up question so that it can be understood without the conversation.

Rules:
- Replace every reference back to the conversation with the words it stands for: pronouns ("it", "they",
  "ông ấy") and indirect ones ("the other group", "nhóm khác", "cái đó", "vậy còn").
- Keep the user's language, and keep it a single question.
- Add nothing the conversation does not say. Never invent names, numbers or documents.
- If the question mentions its own subject already, repeat it unchanged.
- Answer with the rewritten question only: no explanation, no quotation marks.

Example
Conversation:
user: Ai là người bình an?
assistant: Người bình an là người mở nhà mình cho nhóm Come and See.
Follow-up question: Còn nhóm khác thì sao?
Rewritten: Các nhóm khác ngoài nhóm Come and See thì như thế nào?"""


def trim_history(history: list[Turn]) -> list[Turn]:
    """Keep only the last few turns, each shortened: enough to resolve a pronoun, not a whole transcript."""
    recent = history[-MAX_HISTORY_TURNS:]
    return [Turn(turn.role, turn.text[:MAX_HISTORY_CHARS_PER_TURN]) for turn in recent]


def build_condense_messages(question: str, history: list[Turn]) -> list[dict[str, str]]:
    """The chat messages that ask for the rewrite. Pure: no network, no settings beyond the prompt."""
    conversation = "\n".join(f"{turn.role}: {turn.text}" for turn in trim_history(history))
    return [
        {"role": "system", "content": CONDENSE_PROMPT},
        {"role": "user", "content": f"Conversation:\n{conversation}\n\nFollow-up question: {question}"},
    ]


def condense_question(
    question: str,
    history: list[Turn],
    *,
    generate: Rewriter = generate_answer,
) -> str:
    """Return a self-contained question. Falls back to `question` whenever the rewrite can't be trusted."""
    if not history:
        return question  # the first question of a conversation resolves to nothing

    try:
        rewritten = generate(
            build_condense_messages(question, history), deadline_seconds=CONDENSE_DEADLINE_SECONDS
        ).text.strip()
    except Exception:
        # Busy or slow providers must not cost us the answer: search with the user's own words instead.
        return question

    # A rewrite that is empty, or much longer than the question, is a sign the model did something else.
    if not rewritten or len(rewritten) > MAX_CONDENSED_QUESTION_CHARS:
        return question
    return rewritten
