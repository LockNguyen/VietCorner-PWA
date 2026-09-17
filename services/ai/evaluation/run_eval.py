"""
What it does:  Compares embedding models on YOUR documents and questions, then writes evaluation/results.md.
Concept:       Leaderboards measure other people's data. The question that matters is "which model finds the
               right passage in OUR PDFs, for OUR users' questions (Vietnamese, English, and mixed)?".
               For each model we embed all chunks, embed each question, rank chunks by cosine similarity,
               and score the ranking (Recall@5, MRR). We also time query embedding (p50/p95), because the
               phone waits for it.
Why this design: Runs fully in memory with NumPy (no database), so comparing models is quick and repeatable.
               Pure ranking/scoring functions; this file only orchestrates and reports.
Inputs/Outputs: PDFs in data/ + evaluation/questions.jsonl -> evaluation/results.md (commit it).
Run:           python -m evaluation.run_eval
Common pitfalls:
  - Writing questions by copying sentences from the PDF. Real users paraphrase; write questions the way
    an elderly church member would ask them out loud.
  - Too few questions: with 5 questions, one lucky hit swings Recall by 20%. Aim for 30+.
  - Timing the first call, which includes model warm-up. Warm up before measuring.
"""

import json
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from config import CANDIDATE_MODELS, DATA_DIR, SERVICE_ROOT, TOP_K
from domain import Chunk, RetrievedChunk
from evaluation.metrics import location_id, recall_at_k, reciprocal_rank
from ingest.chunk import chunk_pages
from ingest.extract import extract_pages
from rag.embeddings import embed_passages, embed_query, load_model

QUESTIONS_PATH = SERVICE_ROOT / "evaluation" / "questions.jsonl"
RESULTS_PATH = SERVICE_ROOT / "evaluation" / "results.md"


@dataclass(frozen=True)
class EvalQuestion:
    question: str
    language: str  # "vi" or "en". Lets the report break results down by language.
    document: str | None  # None when the documents cannot answer the question
    pages: tuple[int, ...]  # every page that answers it; empty for unanswerable questions
    note: str = ""  # why the question is tricky, or why it is unanswerable

    @property
    def is_answerable(self) -> bool:
        return bool(self.pages)


@dataclass(frozen=True)
class ModelResult:
    model_name: str
    recall_at_k: float
    mrr: float
    recall_by_language: dict[str, float]  # {"vi": ..., "en": ...}: an average hides a weak language
    max_unanswerable_similarity: float  # highest score reached by a question with no answer.
    #                                     SIMILARITY_FLOOR must sit above this and below the answerable scores.
    p50_query_ms: float
    p95_query_ms: float


def load_questions(path: Path = QUESTIONS_PATH) -> list[EvalQuestion]:
    """Read one JSON object per line (see evaluation/questions.jsonl).
    """
    eval_questions = []

    with open(path, "r", encoding="utf-8") as file:
        for line in file:
            data = json.loads(line)
            eval_questions.append(EvalQuestion(data["question"], data["language"],
                                               data["document"], tuple(data["pages"]),
                                               data.get("note", "")))
    return eval_questions


def rank_chunks(query_vector: np.ndarray, chunk_matrix: np.ndarray, chunks: list[Chunk], k: int) -> list[RetrievedChunk]:
    """Return the k chunks most similar to the query.

    Vectors are normalized, so cosine similarity = dot product: scores = chunk_matrix @ query_vector.
    """
    cosine_similarity_scores = chunk_matrix @ query_vector
    best_chunk_indices = np.argsort(-cosine_similarity_scores)[:k]
    return [RetrievedChunk(chunks[i], cosine_similarity_scores[i].item()) for i in best_chunk_indices]


def evaluate_model(model_name: str, chunks: list[Chunk], questions: list[EvalQuestion]) -> ModelResult:
    """Score one model.
    """
    chunk_matrix = np.array(embed_passages([chunk.text for chunk in chunks], model_name))

    embed_query("warm up", model_name)

    latencies = []
    recall_at_k_scores = []
    reciprocal_rank_scores = []
    recall_by_language = {}
    max_unanswerable_similarity = 0.0

    for question in questions:
        start_time = time.perf_counter()
        query_vector = embed_query(question.question, model_name)
        end_time = time.perf_counter()
        latencies.append((end_time - start_time) * 1000)
        
        ranked_chunks = rank_chunks(np.array(query_vector), chunk_matrix, chunks, TOP_K)
        ranked_pages_ids = [location_id(ranked_chunk.chunk.document, ranked_chunk.chunk.page_number) for ranked_chunk in ranked_chunks]

        # Answerable questions
        if question.is_answerable:
            relevant_pages_ids = {location_id(str(question.document), page) for page in question.pages}

            # Measure recall overall
            recall_at_k_score = recall_at_k(ranked_pages_ids, relevant_pages_ids, TOP_K)
            recall_at_k_scores.append(recall_at_k_score)

            # Measure RR overall
            reciprocal_rank_score = reciprocal_rank(ranked_pages_ids, relevant_pages_ids)
            reciprocal_rank_scores.append(reciprocal_rank_score)

            # Measure recall by language
            recall_by_language.setdefault(question.language, []).append(recall_at_k_score)

        # Unanswerable questions
        else:
            # Max similarity score within the retrieved chunks for an unanswerable
            # question is simply the highest ranked chunk's similarity score.
            max_unanswerable_similarity = max(max_unanswerable_similarity, ranked_chunks[0].similarity)

    if len(recall_at_k_scores) == 0 or len(reciprocal_rank_scores) == 0:
        raise ValueError("The question set has no answerable questions, so there is no Recall@k or MRR score.")

    mean_recall_by_language = {language: sum(recall_scores) / len(recall_scores)
                               for language, recall_scores in recall_by_language.items()}

    return ModelResult(model_name=model_name,
                       recall_at_k=sum(recall_at_k_scores) / len(recall_at_k_scores),
                       mrr=sum(reciprocal_rank_scores) / len(reciprocal_rank_scores),
                       recall_by_language=mean_recall_by_language,
                       max_unanswerable_similarity=max_unanswerable_similarity,
                       p50_query_ms=np.percentile(latencies, 50),
                       p95_query_ms=np.percentile(latencies, 95))
            

def format_report(results: list[ModelResult]) -> str:
    """Render the comparison as Markdown, best MRR first. Pure function: no file I/O, so it is easy to test."""
    lines = [
        "# Embedding model comparison",
        "",
        f"Question set: `evaluation/questions.jsonl`. Retrieval is scored at page level, top {TOP_K}.",
        "",
        f"| Model | Recall@{TOP_K} | Recall vi | Recall en | MRR | max sim (unanswerable) | p50 ms | p95 ms |",
        "|---|---|---|---|---|---|---|---|",
    ]

    for result in sorted(results, key=lambda result: result.mrr, reverse=True):
        recall_vi = result.recall_by_language.get("vi", 0.0)
        recall_en = result.recall_by_language.get("en", 0.0)
        lines.append(
            f"| {result.model_name} | {result.recall_at_k:.2f} | {recall_vi:.2f} | {recall_en:.2f} "
            f"| {result.mrr:.2f} | {result.max_unanswerable_similarity:.2f} "
            f"| {result.p50_query_ms:.0f} | {result.p95_query_ms:.0f} |"
        )

    lines += [
        "",
        "**Reading this table:** choose by MRR and Recall, then check the language columns, because an average can",
        "hide a weak language. `max sim (unanswerable)` is the highest similarity reached by a question the documents",
        "cannot answer, so `SIMILARITY_FLOOR` must sit above it or the assistant will answer questions it should refuse.",
        "",
    ]
    return "\n".join(lines)


def write_report(results: list[ModelResult], path: Path = RESULTS_PATH) -> None:
    """Save the report next to the question set. Commit it: decisions should cite numbers."""
    path.write_text(format_report(results), encoding="utf-8")


def main() -> None:
    """Recipe: load the data once, score every candidate model, write the report."""
    questions = load_questions()
    chunks = chunk_pages([page for pdf_path in sorted(DATA_DIR.glob("*.pdf")) for page in extract_pages(pdf_path)])
    print(f"{len(questions)} questions | {len(chunks)} chunks | {len(CANDIDATE_MODELS)} models", flush=True)

    results = []
    for model_name in CANDIDATE_MODELS:
        print(f"evaluating {model_name} ...", flush=True)
        results.append(evaluate_model(model_name, chunks, questions))
        # Each model holds 1-2 GB of weights. Drop it before loading the next one.
        load_model.cache_clear()

    write_report(results)
    print(format_report(results))
    print(f"saved to {RESULTS_PATH}")


if __name__ == "__main__":
    main()
