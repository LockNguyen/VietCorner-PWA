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
                 We also use compare pages (ids) retrieved against the ground truth pages because pages don't move.
                 Otherwise, if we compared chunk ids against ground truth chunk ids, then we'd need to recalculate
                 chunk ids everytime we redefine how many words a chunk is. Cons: a page hit can be the wrong half
                 of the right page, but that's a coarseness we accept for stability.
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
    In other words, among the top k ranked pages that came up, how
    many of them appear are the golden/ground truth pages?

    relevant_ids: golden/ground truth pages.
    ranked_ids: pages ranked by cosine similarity after they are retrieved.
    """
    if len(relevant_ids) == 0:
        raise ValueError("A question must have an expected answer location.")

    found = set(ranked_ids[:k]) & relevant_ids
    return len(found) / len(relevant_ids)


def reciprocal_rank(ranked_ids: list[str], relevant_ids: set[str]) -> float:
    """1 / (1-based position of the first relevant id), or 0.0 if none is relevant.
    """
    for position, ranked_id in enumerate(ranked_ids, start=1):
        if ranked_id in relevant_ids:
            return 1 / position
    return 0.0
