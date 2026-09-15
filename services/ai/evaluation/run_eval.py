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
    document: str  # where the answer is
    page_number: int


@dataclass(frozen=True)
class ModelResult:
    model_name: str
    recall_at_k: float
    mrr: float
    p50_query_ms: float
    p95_query_ms: float


def load_questions(path: Path = QUESTIONS_PATH) -> list[EvalQuestion]:
    """Read one JSON object per line (see questions.example.jsonl).

    TODO(M3): for each non-blank line: data = json.loads(line); EvalQuestion(data["question"], data["language"],
              data["document"], data["page"]).
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
         relevant = {location_id(q.document, q.page_number)}
         collect recall_at_k(ranked_ids, relevant, TOP_K) and reciprocal_rank(ranked_ids, relevant)
      4. Return ModelResult(model_name, mean recall, mean reciprocal rank,
                            np.percentile(latencies, 50), np.percentile(latencies, 95))
    """
    raise NotImplementedError("M3: implement evaluate_model")


def write_report(results: list[ModelResult], path: Path = RESULTS_PATH) -> None:
    """Write a Markdown table, best MRR first, e.g.

        | Model | Recall@5 | MRR | p50 query ms | p95 query ms |
        |---|---|---|---|---|
        | BAAI/bge-m3 | 0.93 | 0.81 | 120 | 180 |

    TODO(M3): sort results by mrr descending, build the lines, path.write_text("\\n".join(lines), encoding="utf-8").
    """
    raise NotImplementedError("M3: implement write_report")


def main() -> None:
    """Recipe: load data once, evaluate every candidate model, write the report.

    TODO(M3):
      1. questions = load_questions()
      2. chunks = chunk_pages([page for pdf in sorted(DATA_DIR.glob("*.pdf")) for page in extract_pages(pdf)])
      3. results = [evaluate_model(name, chunks, questions) for name in CANDIDATE_MODELS]
      4. write_report(results); print the table.
    """
    raise NotImplementedError("M3: implement main")


if __name__ == "__main__":
    main()
