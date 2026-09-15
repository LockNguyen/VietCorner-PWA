"""
What it does:  Scores a ranked search result against the location we know is correct.
Concept:       Retrieval quality is measured BEFORE the LLM, because the LLM can't answer from a passage
               that was never retrieved.
               - Recall@k: of the relevant locations, what fraction appear in the top k results? With one
                 correct location per question it's simply 1.0 (found in top k) or 0.0 (missed).
               - Reciprocal rank: 1 / position of the first relevant result (1st -> 1.0, 2nd -> 0.5,
                 3rd -> 0.33, none -> 0). Averaged over questions it's MRR, which rewards ranking the
                 right passage first.
Why this design: Pure functions over location ids ("document#page"), independent of any model or database.
Inputs/Outputs: ranked ids + relevant ids -> float in [0, 1].
Common pitfalls:
  - Counting duplicates: several chunks from the same page can appear in the top k. Count a page once.
  - Positions are 1-based in the reciprocal rank formula.
"""


def location_id(document: str, page_number: int) -> str:
    """Identify a place in the documents. The evaluation counts page-level hits."""
    return f"{document}#{page_number}"


def recall_at_k(ranked_ids: list[str], relevant_ids: set[str], k: int) -> float:
    """Fraction of relevant_ids found among the first k ranked_ids.

    TODO(M3):
      1. If relevant_ids is empty, raise ValueError (a question must have an expected answer location).
      2. found = relevant_ids & set(ranked_ids[:k])
      3. Return len(found) / len(relevant_ids)
    """
    raise NotImplementedError("M3: implement recall_at_k")


def reciprocal_rank(ranked_ids: list[str], relevant_ids: set[str]) -> float:
    """1 / (1-based position of the first relevant id), or 0.0 if none is relevant.

    TODO(M3): loop with enumerate(ranked_ids, start=1); return 1 / position at the first id in relevant_ids.
    """
    raise NotImplementedError("M3: implement reciprocal_rank")
