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
from domain import Chunk
from evaluation.metrics import location_id, recall_at_k, reciprocal_rank
from ingest.chunk import chunk_pages
from ingest.extract import extract_pages
from rag.embeddings import embed_passages, embed_query

QUESTIONS_PATH = SERVICE_ROOT / "evaluation" / "questions.jsonl"
RESULTS_PATH = SERVICE_ROOT / "evaluation" / "results.md"


@dataclass(frozen=True)
class EvalQuestion:
    question: str
    language: str  # "vi" or "en". Lets the report break results down by language.
    document: str | None  # None when the documents cannot answer the question
    pages: tuple[int, ...]  # every page that answers it; empty for unanswerable questions
    note: str = ""  # why the question is tricky, or why it is unanswerable


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

    TODO(M3): for each non-blank line: data = json.loads(line); EvalQuestion(data["question"], data["language"],
              data["document"], tuple(data["pages"]), data.get("note", "")).
    Unanswerable questions have "document": null and "pages": []. Keep them: they set the similarity floor.
    """
    raise NotImplementedError("M3: implement load_questions")


def rank_chunks(query_vector: np.ndarray, chunk_matrix: np.ndarray, chunks: list[Chunk], k: int) -> list[Chunk]:
    """Return the k chunks most similar to the query.

    Vectors are normalized, so cosine similarity = dot product: scores = chunk_matrix @ query_vector.

    TODO(M3):
      1. scores = chunk_matrix @ query_vector            (shape: [number_of_chunks])
      2. best = np.argsort(-scores)[:k]                  (indices of the highest scores first)
      3. Return [chunks[i] for i in best]
    """
    raise NotImplementedError("M3: implement rank_chunks")


def evaluate_model(model_name: str, chunks: list[Chunk], questions: list[EvalQuestion]) -> ModelResult:
    """Score one model.

    TODO(M3):
      1. chunk_matrix = np.array(embed_passages([c.text for c in chunks], model_name))
      2. Warm up: embed_query("warm up", model_name)
      3. For each question: time embed_query with time.perf_counter() -> latency list;
         ranked = rank_chunks(np.array(vector), chunk_matrix, chunks, TOP_K);
         ranked_ids = [location_id(c.document, c.page_number) for c in ranked]
      4. For ANSWERABLE questions (question.pages is not empty):
         relevant = {location_id(question.document, page) for page in question.pages}
         collect recall_at_k(ranked_ids, relevant, TOP_K) and reciprocal_rank(ranked_ids, relevant).
         Also collect the recall per language, so a good English average can't hide weak Vietnamese.
      5. For UNANSWERABLE questions: record the best similarity (chunk_matrix @ query_vector).max().
         The highest of these is max_unanswerable_similarity.
      6. Return ModelResult(...) with the means, the per-language recalls, that maximum,
         np.percentile(latencies, 50) and np.percentile(latencies, 95).
    """
    raise NotImplementedError("M3: implement evaluate_model")


def write_report(results: list[ModelResult], path: Path = RESULTS_PATH) -> None:
    """Write a Markdown table, best MRR first, e.g.

        | Model | Recall@5 | Recall vi | Recall en | MRR | max sim (unanswerable) | p50 ms | p95 ms |
        |---|---|---|---|---|---|---|---|
        | BAAI/bge-m3 | 0.73 | 0.65 | 1.00 | 0.56 | 0.61 | 132 | 142 |

    TODO(M3): sort results by mrr descending, build the lines, path.write_text("\\n".join(lines), encoding="utf-8").
    """
    raise NotImplementedError("M3: implement write_report")


def main() -> None:
    """Recipe: load data once, evaluate every candidate model, write the report.

    TODO(M3):
      1. questions = load_questions()
      2. chunks = chunk_pages([page for pdf in sorted(DATA_DIR.glob("*.pdf")) for page in extract_pages(pdf)])
      3. results = [evaluate_model(name, chunks, questions) for name in CANDIDATE_MODELS]
         Call load_model.cache_clear() after each model: three of them held in memory at once is several GB.
      4. write_report(results); print the table.
    """
    raise NotImplementedError("M3: implement main")


if __name__ == "__main__":
    main()
