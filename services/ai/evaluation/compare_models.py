"""
What it does:  Asks the same questions to several Groq chat models over the SAME retrieved evidence, and
               writes every answer to a Markdown file you can read later.
Concept:       Two things decide an answer: which passages retrieval found, and what the model does with them.
               To compare models fairly you must hold the first one fixed. So each question is embedded and
               searched exactly once, and that identical context is handed to every model. Any difference in
               the output is then the model, not luck in retrieval.
Why this design: It reuses `answer_question` through its injection points (`embed`, `search`, `generate`),
               so the comparison exercises the real pipeline, including the SIMILARITY_FLOOR refusal, rather
               than a copy of it. One failing model (bad id, rate limit, timeout) is recorded and the run
               continues.
Inputs/Outputs: questions.jsonl + the database -> evaluation/answers/<timestamp>.md + a summary table.
Run:           python -m evaluation.compare_models llama-3.3-70b-versatile qwen/qwen3-32b ...
               python -m evaluation.compare_models --questions 2,12,25 --sleep 3 <model ids...>
               (with no ids, config.CANDIDATE_CHAT_MODELS is used)
Common pitfalls:
  - Rate limits: Groq's free tier caps requests AND tokens per minute, per model. Each answer here sends
    ~2-3k tokens of context, so the run pauses between calls. Raise --sleep if you see 429s.
  - Comparing answers written at different times against different evidence. Always re-run the whole file.
"""

import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import partial
from pathlib import Path

from config import (
    CANDIDATE_CHAT_MODELS,
    GENERATION_TEMPERATURE,
    MAX_ANSWER_TOKENS,
    SIMILARITY_FLOOR,
    SERVICE_ROOT,
    TOP_K,
)
from domain import Answer, RetrievedChunk
from evaluation.run_eval import EvalQuestion, load_questions
from rag.answer import NOT_FOUND_TEXT, answer_question, search_with_new_connection
from rag.embeddings import embed_query
from rag.generate import generate_answer

ANSWERS_DIR = SERVICE_ROOT / "evaluation" / "answers"
DEFAULT_QUESTION_INDEXES = [
    24
]  # [2, 12, 24, 27, 35] easy vi, trick (8 not 5), hard multi-hop, en twin, wrong premise
DEFAULT_SLEEP_SECONDS = (
    2.0  # why: stays under the free tier's per-minute limits on small models
)
RATE_LIMIT_BACKOFF_SECONDS = 20.0


@dataclass(frozen=True)
class Attempt:
    """One model's attempt at one question."""

    model_name: str
    answer: Answer | None
    error: str
    seconds: float

    @property
    def outcome(self) -> str:
        if self.error:
            return "ERROR"
        if self.answer is not None and self.answer.text == NOT_FOUND_TEXT:
            return "refused"
        return "answered"


def retrieve(question_text: str) -> tuple[list[float], list[RetrievedChunk]]:
    """Embed and search once, so every model sees identical evidence."""
    query_vector = embed_query(question_text)
    return query_vector, search_with_new_connection(query_vector)


def ask_model(
    model_name: str,
    question_text: str,
    query_vector: list[float],
    retrieved: list[RetrievedChunk],
) -> Attempt:
    """Run the real pipeline with retrieval frozen and only the chat model swapped."""
    start = time.perf_counter()
    try:
        answer = answer_question(
            question_text,
            embed=lambda _text: query_vector,
            search=lambda _vector: retrieved,
            generate=partial(generate_answer, model_name=model_name),
        )
        return Attempt(model_name, answer, "", time.perf_counter() - start)
    except (
        Exception
    ) as error:  # a bad model id, a rate limit, a timeout: record it and keep going
        return Attempt(
            model_name,
            None,
            f"{type(error).__name__}: {error}"[:300],
            time.perf_counter() - start,
        )


def format_report(
    questions: list[EvalQuestion],
    attempts: dict[int, list[Attempt]],
    model_names: list[str],
) -> str:
    """Render the whole comparison as Markdown."""
    lines = [
        f"# Chat model comparison ({datetime.now(timezone.utc):%Y-%m-%d %H:%M} UTC)",
        "",
        f"Settings: temperature {GENERATION_TEMPERATURE}, max answer tokens {MAX_ANSWER_TOKENS}, "
        f"top {TOP_K} chunks, similarity floor {SIMILARITY_FLOOR}.",
        "Every model received the same retrieved chunks for a given question.",
        "",
        "## Summary",
        "",
        "| Question | " + " | ".join(model_names) + " |",
        "|---" * (len(model_names) + 1) + "|",
    ]
    for index, question in enumerate(questions):
        cells = [
            f"{attempt.outcome} ({attempt.seconds:.1f}s)" for attempt in attempts[index]
        ]
        lines.append(
            f"| #{index} {question.question[:40]}… | " + " | ".join(cells) + " |"
        )

    for index, question in enumerate(questions):
        lines += [
            "",
            "---",
            "",
            f"## #{index} {question.question}",
            "",
            f"- language: {question.language}",
            f"- expected: {'pages ' + str(list(question.pages)) if question.is_answerable else 'NO ANSWER in the documents'}",
            f"- note: {question.note}",
        ]
        first = attempts[index][0]
        if first.answer is not None and first.answer.sources:
            sources = ", ".join(
                f"p.{source.page_number} ({source.similarity:.2f})"
                for source in first.answer.sources
            )
            lines.append(f"- retrieved pages (same for every model): {sources}")

        for attempt in attempts[index]:
            lines += [
                "",
                f"### {attempt.model_name} — {attempt.outcome}, {attempt.seconds:.1f}s",
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
    model_names: list[str], question_indexes: list[int], sleep_seconds: float
) -> Path:
    """Ask every model every question, then write the report. Returns the file it wrote."""
    all_questions = load_questions()
    questions = [all_questions[index] for index in question_indexes]
    attempts: dict[int, list[Attempt]] = {}

    print(
        f"{len(model_names)} models x {len(questions)} questions = {len(model_names) * len(questions)} requests",
        flush=True,
    )

    for index, question in enumerate(questions):
        query_vector, retrieved = retrieve(question.question)
        pages = [chunk.chunk.page_number for chunk in retrieved]
        print(
            f"\n#{index} {question.question[:60]}  retrieved pages {pages}", flush=True
        )

        attempts[index] = []
        for model_name in model_names:
            attempt = ask_model(model_name, question.question, query_vector, retrieved)
            if "rate" in attempt.error.lower() or "429" in attempt.error:
                print(
                    f"   {model_name}: rate limited, waiting {RATE_LIMIT_BACKOFF_SECONDS:.0f}s and retrying",
                    flush=True,
                )
                time.sleep(RATE_LIMIT_BACKOFF_SECONDS)
                attempt = ask_model(
                    model_name, question.question, query_vector, retrieved
                )

            attempts[index].append(attempt)
            print(
                f"   {model_name:<40}{attempt.outcome:<10}{attempt.seconds:5.1f}s {attempt.error[:60]}",
                flush=True,
            )
            time.sleep(sleep_seconds)

    ANSWERS_DIR.mkdir(exist_ok=True)
    path = ANSWERS_DIR / f"{datetime.now(timezone.utc):%Y%m%d-%H%M}.md"
    path.write_text(format_report(questions, attempts, model_names), encoding="utf-8")
    return path


def main(argv: list[str]) -> None:
    question_indexes = DEFAULT_QUESTION_INDEXES
    sleep_seconds = DEFAULT_SLEEP_SECONDS
    model_names: list[str] = []

    arguments = list(argv)
    while arguments:
        argument = arguments.pop(0)
        if argument == "--questions":
            question_indexes = [int(value) for value in arguments.pop(0).split(",")]
        elif argument == "--sleep":
            sleep_seconds = float(arguments.pop(0))
        else:
            model_names.append(argument)

    model_names = model_names or list(CANDIDATE_CHAT_MODELS)
    if not model_names:
        print(
            "No models given. Pass model ids as arguments, or fill CANDIDATE_CHAT_MODELS in config.py."
        )
        return

    path = compare(model_names, question_indexes, sleep_seconds)
    print(f"\nwritten to {path}")


if __name__ == "__main__":
    main(sys.argv[1:])
