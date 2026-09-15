"""Fixtures shared by all tests."""

from pathlib import Path

import pytest

from tests.sample_pdf import make_sample_pdf


@pytest.fixture(scope="session")
def sample_pdf(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """The synthetic bilingual policy PDF (pages 1, 2, 4 have text; page 3 is blank)."""
    return make_sample_pdf(tmp_path_factory.mktemp("pdfs") / "sample_policy.pdf")
