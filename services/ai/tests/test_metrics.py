"""M3: retrieval metrics."""

import pytest

from evaluation.metrics import location_id, recall_at_k, reciprocal_rank


def test_location_id_combines_document_and_page():
    assert location_id("policy.pdf", 3) == "policy.pdf#3"


def test_recall_is_one_when_the_relevant_id_is_in_the_top_k():
    assert recall_at_k(["a", "b", "c"], {"b"}, k=2) == 1.0


def test_recall_is_zero_when_the_relevant_id_is_below_k():
    assert recall_at_k(["a", "b", "c"], {"c"}, k=2) == 0.0


def test_recall_is_the_fraction_of_relevant_ids_found():
    assert recall_at_k(["a", "b", "c"], {"a", "z"}, k=3) == 0.5


def test_recall_requires_at_least_one_relevant_id():
    with pytest.raises(ValueError):
        recall_at_k(["a"], set(), k=1)


def test_reciprocal_rank_uses_one_based_positions():
    assert reciprocal_rank(["a", "b", "c"], {"b"}) == 0.5


def test_reciprocal_rank_counts_only_the_first_relevant_hit():
    assert reciprocal_rank(["a", "b", "c"], {"a", "c"}) == 1.0


def test_reciprocal_rank_is_zero_when_nothing_relevant_is_found():
    assert reciprocal_rank(["a", "b"], {"z"}) == 0.0
