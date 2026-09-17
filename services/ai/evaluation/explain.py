"""
What it does:  Prints one question travelling through the retrieval pipeline, showing the real value at every
               step: the query vector, the similarity spread, the top-k chunks, the ids handed to the metrics,
               and the metric results. `--all` does the same for the whole question set and adds the summary
               numbers plus a similarity histogram.
Concept:       An evaluation number like "Recall@5 = 0.73" is an average of many small, concrete events. This
               tool shows those events, so a metric stops being a mystery: you can see which page won, by how
               much, and why a question scored 0 or 1.
Why this design: It calls YOUR functions (rank_chunks, recall_at_k, reciprocal_rank), so what you see is what
               your code does, not a second implementation that might disagree. It also prints the raw inputs
               next to each result, so a wrong metric is visible instead of hidden behind one number.
               Chunk vectors are cached on disk, because embedding 533 chunks takes ~7 minutes.
Inputs/Outputs: questions.jsonl + the PDFs -> printed report. No files are changed except the vector cache.
Run:           python -m evaluation.explain --index 2          (question 2 from questions.jsonl)
               python -m evaluation.explain "your own question"
               python -m evaluation.explain --all
Common pitfalls:
  - Forgetting UTF-8 output on Windows: set PYTHONIOENCODING=utf-8 or Vietnamese text crashes the console.
  - Comparing runs after changing CHUNK_WORDS or the model: delete evaluation/.cache first.
"""

import sys

import numpy as np

from config import CHUNK_OVERLAP_WORDS, CHUNK_WORDS, DATA_DIR, EMBEDDING_MODEL, SERVICE_ROOT, TOP_K
from domain import Chunk
from evaluation.metrics import location_id, recall_at_k, reciprocal_rank
from evaluation.run_eval import EvalQuestion, load_questions, rank_chunks
from ingest.chunk import chunk_pages
from ingest.extract import extract_pages
from rag.embeddings import embed_passages, embed_query

CACHE_DIR = SERVICE_ROOT / "evaluation" / ".cache"


def load_corpus() -> tuple[list[Chunk], np.ndarray]:
    """Chunk every PDF and embed the chunks once, caching the vectors on disk."""
    chunks = chunk_pages([page for pdf_path in sorted(DATA_DIR.glob("*.pdf")) for page in extract_pages(pdf_path)])
    CACHE_DIR.mkdir(exist_ok=True)
    cache_path = CACHE_DIR / f"{EMBEDDING_MODEL.replace('/', '_')}_{len(chunks)}.npy"

    if cache_path.exists():
        return chunks, np.load(cache_path)

    print(f"embedding {len(chunks)} chunks once (a few minutes), caching in {cache_path.name} ...", flush=True)
    vectors = np.array(embed_passages([chunk.text for chunk in chunks]))
    np.save(cache_path, vectors)
    return chunks, vectors


def explain_one(question: EvalQuestion, chunks: list[Chunk], chunk_matrix: np.ndarray) -> None:
    """Print every step for a single question."""
    print("=" * 100)
    print(f"QUESTION ({question.language}): {question.question}")
    if question.note:
        print(f"note: {question.note}")

    # --- Step 1: the question becomes a vector ------------------------------------------------------
    query_vector = np.array(embed_query(question.question))
    print(f"\n[1] query vector: {len(query_vector)} numbers, length {np.linalg.norm(query_vector):.3f} "
          f"(1.0 = normalized), first 5: {np.round(query_vector[:5], 3).tolist()}")

    # --- Step 2: one similarity per chunk -----------------------------------------------------------
    similarities = chunk_matrix @ query_vector  # normalized vectors, so this dot product IS cosine similarity
    print(f"[2] similarity against all {len(chunks)} chunks: "
          f"max {similarities.max():.3f} | median {np.median(similarities):.3f} | min {similarities.min():.3f}")

    # --- Step 3: keep the best k --------------------------------------------------------------------
    ranked_chunks = rank_chunks(query_vector, chunk_matrix, chunks, TOP_K)
    gold_pages = set(question.pages)
    print(f"\n[3] top {TOP_K} chunks (rank_chunks), * marks a page in the gold answer:")
    print(f"    {'rank':<5}{'page':<7}{'chunk':<7}{'sim':<8}text")
    for rank, chunk in enumerate(ranked_chunks, start=1):
        marker = "*" if chunk.page_number in gold_pages else " "
        similarity = float(chunk_matrix[chunks.index(chunk)] @ query_vector)
        print(f"  {marker} {rank:<5}{chunk.page_number:<7}{chunk.chunk_index:<7}{similarity:<8.3f}{chunk.text[:60]}")

    # --- Step 4: chunks become page ids -------------------------------------------------------------
    ranked_page_ids = [location_id(chunk.document, chunk.page_number) for chunk in ranked_chunks]
    short = [page_id.split("#")[-1] for page_id in ranked_page_ids]
    print(f"\n[4] ranked_page_ids (order matters, duplicates kept): pages {short}")
    if not question.is_answerable:
        print(f"    UNANSWERABLE question: no gold pages. Best similarity {similarities.max():.3f} "
              f"is what SIMILARITY_FLOOR has to stay above.")
        return
    relevant_page_ids = {location_id(question.document, page) for page in question.pages}
    print(f"    relevant_page_ids (a set, order irrelevant): pages {sorted(page for page in question.pages)}")

    # --- Step 5: the metrics ------------------------------------------------------------------------
    found = sorted({page_id.split('#')[-1] for page_id in ranked_page_ids} & {p.split('#')[-1] for p in relevant_page_ids})
    positions = [rank for rank, page_id in enumerate(ranked_page_ids, start=1) if page_id in relevant_page_ids]
    print(f"\n[5] metrics")
    print(f"    gold pages found in top {TOP_K}: {found or 'none'} out of {sorted(question.pages)}")
    print(f"    recall_at_k  = {recall_at_k(ranked_page_ids, relevant_page_ids, TOP_K):.3f}"
          f"   (fraction of the {len(question.pages)} gold pages that appear)")
    print(f"    relevant ids sit at positions {positions or 'nowhere'} in the ranked list")
    expected_rr = 1 / positions[0] if positions else 0.0
    print(f"    reciprocal_rank = {reciprocal_rank(ranked_page_ids, relevant_page_ids):.3f}"
          f"   (expected 1/{positions[0]} = {expected_rr:.3f})" if positions
          else f"    reciprocal_rank = {reciprocal_rank(ranked_page_ids, relevant_page_ids):.3f}   (expected 0.0)")


def explain_all(questions: list[EvalQuestion], chunks: list[Chunk], chunk_matrix: np.ndarray) -> None:
    """One line per question, then the aggregate numbers the report is built from."""
    print(f"corpus: {len(chunks)} chunks of ~{CHUNK_WORDS} words (overlap {CHUNK_OVERLAP_WORDS}) | model {EMBEDDING_MODEL}")
    print(f"\n{'#':<4}{'lang':<6}{'gold pages':<22}{'top-5 pages':<26}{'recall':<9}{'RR':<7}best sim")
    print("-" * 100)

    recalls, reciprocal_ranks, recalls_by_language = [], [], {}
    answerable_best, unanswerable_best = [], []

    for index, question in enumerate(questions):
        query_vector = np.array(embed_query(question.question))
        similarities = chunk_matrix @ query_vector
        ranked_chunks = rank_chunks(query_vector, chunk_matrix, chunks, TOP_K)
        ranked_page_ids = [location_id(chunk.document, chunk.page_number) for chunk in ranked_chunks]
        top_pages = [chunk.page_number for chunk in ranked_chunks]
        best_similarity = float(similarities.max())

        if not question.is_answerable:
            unanswerable_best.append(best_similarity)
            print(f"{index:<4}{question.language:<6}{'(unanswerable)':<22}{str(top_pages):<26}{'-':<9}{'-':<7}{best_similarity:.3f}")
            continue

        relevant_page_ids = {location_id(question.document, page) for page in question.pages}
        recall = recall_at_k(ranked_page_ids, relevant_page_ids, TOP_K)
        rank_score = reciprocal_rank(ranked_page_ids, relevant_page_ids)
        recalls.append(recall)
        reciprocal_ranks.append(rank_score)
        recalls_by_language.setdefault(question.language, []).append(recall)
        answerable_best.append(best_similarity)
        print(f"{index:<4}{question.language:<6}{str(list(question.pages)):<22}{str(top_pages):<26}"
              f"{recall:<9.2f}{rank_score:<7.2f}{best_similarity:.3f}")

    print("-" * 100)
    print(f"Recall@{TOP_K} {np.mean(recalls):.2f} | MRR {np.mean(reciprocal_ranks):.2f} over {len(recalls)} answerable questions")
    for language, values in sorted(recalls_by_language.items()):
        print(f"  {language}: Recall@{TOP_K} {np.mean(values):.2f} over {len(values)} questions")
    print(f"  highest similarity reached by an unanswerable question: {max(unanswerable_best):.3f}")

    print("\nbest-similarity distribution (each x is one question):")
    for label, values in (("answerable  ", answerable_best), ("unanswerable", unanswerable_best)):
        buckets: dict[int, int] = {}
        for value in values:
            buckets[int(value * 20)] = buckets.get(int(value * 20), 0) + 1
        for bucket in sorted(buckets):
            print(f"  {label} {bucket / 20:.2f}-{(bucket + 1) / 20:.2f} {'x' * buckets[bucket]}")
    print("\nOverlapping ranges mean no single SIMILARITY_FLOOR can separate the two groups (see M5).")


def main(argv: list[str]) -> None:
    questions = load_questions()
    chunks, chunk_matrix = load_corpus()

    if not argv:
        print(__doc__)
        return
    if argv[0] == "--all":
        explain_all(questions, chunks, chunk_matrix)
    elif argv[0] == "--index":
        explain_one(questions[int(argv[1])], chunks, chunk_matrix)
    else:
        # A question typed on the command line: treated as answerable-with-no-gold so you still see steps 1-4.
        explain_one(EvalQuestion(" ".join(argv), "??", None, (), "typed on the command line"), chunks, chunk_matrix)


if __name__ == "__main__":
    main(sys.argv[1:])
