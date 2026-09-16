"""
What it does:  Turns text into embeddings (vectors) using an open-source model running on our own machine.
Concept:       A bi-encoder maps any text to a fixed-length vector so that texts with similar meaning get
               vectors pointing in similar directions. A multilingual model maps "background check" and
               "kiểm tra lý lịch" close together, so a Vietnamese question can find an English passage.
               With normalized vectors (length 1), cosine similarity is simply the dot product.
Why this design: The model is loaded once and cached (loading takes seconds; embedding takes milliseconds).
               Separate embed_query / embed_passages functions exist because some models expect different
               prefixes for questions and documents (see config.MODEL_PREFIXES).
Inputs/Outputs: text(s) -> list[float] vectors of length EMBEDDING_DIM, normalized.
Common pitfalls:
  - Loading the model inside embed_query (reloads on every question: seconds of latency).
  - Mixing models: documents embedded with model A can't be searched with query vectors from model B.
  - Forgetting normalize_embeddings=True, which makes dot product != cosine similarity.
"""

from functools import lru_cache

from sentence_transformers import SentenceTransformer

from config import EMBEDDING_MODEL, MODEL_PREFIXES


@lru_cache(maxsize=None)
def load_model(model_name: str = EMBEDDING_MODEL) -> SentenceTransformer:
    """Load a model once per process. lru_cache returns the same object on later calls."""
    return SentenceTransformer(model_name)


def prefixes_for(model_name: str) -> tuple[str, str]:
    """(query prefix, passage prefix) for a model. Most models need none."""
    return MODEL_PREFIXES.get(model_name, ("", ""))


def embed_passages(texts: list[str], model_name: str = EMBEDDING_MODEL) -> list[list[float]]:
    """Embed document chunks. Returns one normalized vector per text, in the same order.

    TODO(M2):
      1. model = load_model(model_name); _, passage_prefix = prefixes_for(model_name)
      2. vectors = model.encode([passage_prefix + t for t in texts], normalize_embeddings=True)
         (encode batches internally and returns a NumPy array of shape (len(texts), dim))
      3. Return vectors.tolist() (plain Python lists are easy to store and send as JSON).
    """
    model = load_model(model_name)
    _, passage_prefix = prefixes_for(model_name)
    vectors = model.encode([passage_prefix + t for t in texts], normalize_embeddings=True)
    return vectors.tolist()
        


def embed_query(text: str, model_name: str = EMBEDDING_MODEL) -> list[float]:
    """Embed one user question. Returns one normalized vector.

    TODO(M2): same as embed_passages, but with the query prefix and a single text.
      Hint: model.encode(query_prefix + text, normalize_embeddings=True).tolist()
    """
    model = load_model(model_name)
    query_prefix, _ = prefixes_for(model_name)
    vector = model.encode(query_prefix + text, normalize_embeddings=True)
    return vector.tolist()