"""
What it does:  Asks the same questions to several chat providers over the SAME retrieved evidence, and writes
               every answer to a Markdown file you can read later.
Concept:       Two things decide an answer: which passages retrieval found, and what the model does with them.
               To compare models fairly you must hold the first one fixed. So each question is embedded and
               searched exactly once, and that identical context is handed to every provider. Any difference
               in the output is then the model, not luck in retrieval.
Why this design: It reuses `answer_question` through its injection points (`embed`, `search`, `generate`), so
               the comparison exercises the real pipeline, including the SIMILARITY_FLOOR refusal. Each
               provider is asked directly (no rotation), because failover would hide which model answered.
               One failing provider (bad model id, rate limit, timeout) is recorded and the run continues.
Inputs/Outputs: questions.jsonl + the database -> evaluation/answers/<timestamp>.md + a summary table.
Run:           python -m evaluation.compare_models                      (every provider configured in .env)
               python -m evaluation.compare_models groq gemini          (only these, by provider name)
               python -m evaluation.compare_models --questions 2,12,25 --sleep 5
Common pitfalls:
  - Free tiers are per minute: each answer sends ~2.4k tokens, so the run pauses between calls. Raise --sleep
    if you still see rate limits.
  - Comparing answers written at different times against different evidence. Always re-run the whole file.
"""

import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import partial
from pathlib import Path

from config import (
    GENERATION_TEMPERATURE,
    MAX_ANSWER_TOKENS,
    SERVICE_ROOT,
    SIMILARITY_FLOOR,
    TOP_K,
)
from domain import Answer, RetrievedChunk
from evaluation.run_eval import EvalQuestion, load_questions
from rag.answer import (
    NOT_FOUND_TEXT,
    answer_question,
    search_with_pooled_connection,
)
from rag.embeddings import embed_query
from rag.generate import generate_answer
from rag.providers import Provider, load_providers

ANSWERS_DIR = SERVICE_ROOT / "evaluation" / "answers"
# easy vi, trick (8 not 5), hard multi-hop, en twin, wrong premise
DEFAULT_QUESTION_INDEXES = [2, 12, 25, 27, 35]
DEFAULT_SLEEP_SECONDS = 2.0  # why: free tiers are measured per minute; a short pause avoids most rate limits
RATE_LIMIT_BACKOFF_SECONDS = 20.0


@dataclass(frozen=True)
class Attempt:
    """One provider's attempt at one question."""

    provider: Provider
    answer: Answer | None
    error: str
    seconds: float

    @property
    def label(self) -> str:
        return f"{self.provider.name} ({self.provider.model})"

    @property
    def outcome(self) -> str:
        if self.error:
            return "ERROR"
        if self.answer is not None and self.answer.text == NOT_FOUND_TEXT:
            return "refused"
        return "answered"


def retrieve(question_text: str) -> tuple[list[float], list[RetrievedChunk]]:
    """Embed and search once, so every provider sees identical evidence."""
    query_vector = embed_query(question_text)
    return query_vector, search_with_pooled_connection(query_vector)


def ask(
    provider: Provider,
    question_text: str,
    query_vector: list[float],
    retrieved: list[RetrievedChunk],
) -> Attempt:
    """Run the real pipeline with retrieval frozen and only the provider swapped."""
    start = time.perf_counter()
    try:
        answer = answer_question(
            question_text,
            embed=lambda _text: query_vector,
            search=lambda _vector: retrieved,
            generate=partial(generate_answer, provider=provider),
        )
        return Attempt(provider, answer, "", time.perf_counter() - start)
    except (
        Exception
    ) as error:  # bad model id, rate limit, timeout: record it and keep going
        return Attempt(
            provider,
            None,
            f"{type(error).__name__}: {error}"[:300],
            time.perf_counter() - start,
        )


def format_report(
    questions: list[EvalQuestion], attempts: dict[int, list[Attempt]]
) -> str:
    """Render the whole comparison as Markdown."""
    labels = [attempt.label for attempt in attempts[0]]
    lines = [
        f"# Chat model comparison ({datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC)",
        "",
        f"Settings: temperature {GENERATION_TEMPERATURE}, max answer tokens {MAX_ANSWER_TOKENS}, "
        f"top {TOP_K} chunks, similarity floor {SIMILARITY_FLOOR}.",
        "Every provider received the same retrieved chunks for a given question.",
        "",
        "## Summary",
        "",
        "| Question | " + " | ".join(labels) + " |",
        "|---" * (len(labels) + 1) + "|",
    ]
    for index, question in enumerate(questions):
        cells = [
            f"{attempt.outcome} ({attempt.seconds:.1f}s)" for attempt in attempts[index]
        ]
        lines.append(
            f"| #{index} {question.question[:40]}… | " + " | ".join(cells) + " |"
        )

    for index, question in enumerate(questions):
        expected = (
            f"pages {list(question.pages)}"
            if question.is_answerable
            else "NO ANSWER in the documents"
        )
        lines += [
            "",
            "---",
            "",
            f"## #{index} {question.question}",
            "",
            f"- language: {question.language}",
            f"- expected: {expected}",
            f"- note: {question.note}",
        ]
        answered = next(
            (attempt for attempt in attempts[index] if attempt.answer is not None), None
        )
        if (
            answered is not None
            and answered.answer is not None
            and answered.answer.sources
        ):
            sources = ", ".join(
                f"p.{source.page_number} ({source.similarity:.2f})"
                for source in answered.answer.sources
            )
            lines.append(f"- retrieved pages (same for every provider): {sources}")

        for attempt in attempts[index]:
            lines += [
                "",
                f"### {attempt.label} — {attempt.outcome}, {attempt.seconds:.1f}s",
            ]
            if attempt.error:
                lines.append(f"```\n{attempt.error}\n```")
                continue
            assert attempt.answer is not None
            lines.append(attempt.answer.text)
            if attempt.answer.timings:
                timings = ", ".join(
                    f"{name} {value:.0f}ms"
                    for name, value in attempt.answer.timings.items()
                )
                lines.append(f"\n_{timings}_")

    return "\n".join(lines) + "\n"


def compare(
    providers: list[Provider], question_indexes: list[int], sleep_seconds: float
) -> Path:
    """Ask every provider every question, then write the report. Returns the file it wrote."""
    all_questions = load_questions()
    questions = [all_questions[index] for index in question_indexes]
    attempts: dict[int, list[Attempt]] = {}

    print(
        f"{len(providers)} providers x {len(questions)} questions = {len(providers) * len(questions)} requests",
        flush=True,
    )

    for index, question in enumerate(questions):
        query_vector, retrieved = retrieve(question.question)
        pages = [chunk.chunk.page_number for chunk in retrieved]
        print(
            f"\n#{index} {question.question[:60]}  retrieved pages {pages}", flush=True
        )

        attempts[index] = []
        for provider in providers:
            attempt = ask(provider, question.question, query_vector, retrieved)
            if "rate" in attempt.error.lower() or "429" in attempt.error:
                print(
                    f"   {provider.name}: rate limited, waiting {RATE_LIMIT_BACKOFF_SECONDS:.0f}s and retrying",
                    flush=True,
                )
                time.sleep(RATE_LIMIT_BACKOFF_SECONDS)
                attempt = ask(provider, question.question, query_vector, retrieved)

            attempts[index].append(attempt)
            print(
                f"   {attempt.label:<45}{attempt.outcome:<10}{attempt.seconds:5.1f}s {attempt.error[:60]}",
                flush=True,
            )
            time.sleep(sleep_seconds)

    ANSWERS_DIR.mkdir(exist_ok=True)
    path = ANSWERS_DIR / f"{datetime.now(timezone.utc):%Y%m%d-%H%M}.md"
    path.write_text(format_report(questions, attempts), encoding="utf-8")
    return path


def main(argv: list[str]) -> None:
    question_indexes = DEFAULT_QUESTION_INDEXES
    sleep_seconds = DEFAULT_SLEEP_SECONDS
    wanted_names: list[str] = []

    arguments = list(argv)
    while arguments:
        argument = arguments.pop(0)
        if argument == "--questions":
            question_indexes = [int(value) for value in arguments.pop(0).split(",")]
        elif argument == "--sleep":
            sleep_seconds = float(arguments.pop(0))
        else:
            wanted_names.append(argument)

    providers = load_providers()
    if wanted_names:
        providers = [
            provider for provider in providers if provider.name in wanted_names
        ]
    if not providers:
        print(
            "No providers configured. Add keys and model ids to .env (see config.CHAT_PROVIDERS)."
        )
        return

    path = compare(providers, question_indexes, sleep_seconds)
    print(f"\nwritten to {path}")


if __name__ == "__main__":
    main(sys.argv[1:])
