"""M2: embeddings. Loads a real model, so these are marked slow. Run with: pytest -m slow"""

import numpy as np
import pytest

from config import EMBEDDING_DIM
from rag.embeddings import embed_passages, embed_query

pytestmark = pytest.mark.slow


def cosine(a: list[float], b: list[float]) -> float:
    return float(np.dot(a, b))  # vectors are normalized, so the dot product IS the cosine similarity


def test_query_vector_has_model_dimension_and_unit_length():
    vector = embed_query("xin chào")
    assert len(vector) == EMBEDDING_DIM
    assert abs(np.linalg.norm(vector) - 1.0) < 1e-3


def test_passages_return_one_vector_per_text():
    assert len(embed_passages(["một", "hai", "ba"])) == 3


def test_vietnamese_question_is_closest_to_the_matching_english_passage():
    question = embed_query("Tình nguyện viên có cần kiểm tra lý lịch không?")
    right, wrong = embed_passages([
        "Volunteers who work with children must complete a background check.",
        "Giving receipts for taxes are mailed every January.",
    ])
    assert cosine(question, right) > cosine(question, wrong)
