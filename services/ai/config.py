"""
What it does:  Every tunable number and every setting of the AI service, in one place.
Concept:       RAG quality depends on a handful of knobs (chunk size, how many chunks to retrieve, when to
               refuse). Keeping them together makes experiments easy: change one value, re-run the evaluation.
Why this design: No magic numbers inside functions. Each constant says WHY it has its value, so a reader
               can challenge it with evidence (see evaluation/results.md).
Inputs/Outputs: Reads secrets from the environment (.env). Exposes module-level constants.
Common pitfalls: Changing EMBEDDING_MODEL without re-ingesting documents. Old vectors and new query
               vectors then live in different "spaces" and search silently returns nonsense.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# --- Paths -------------------------------------------------------------------------------------------
SERVICE_ROOT = Path(__file__).parent
DATA_DIR = SERVICE_ROOT / "data"  # your private PDFs (gitignored)

# --- Chunking (M1) -----------------------------------------------------------------------------------
# We measure chunks in words, not model tokens, so chunking needs no tokenizer and stays a pure function.
# Vietnamese writes one syllable per space-separated "word", so word counts run higher than in English.
CHUNK_WORDS = 300  # why: roughly one policy rule or section. Long enough to keep context, short enough to stay on one topic.
CHUNK_OVERLAP_WORDS = 50  # why: a sentence cut at a chunk boundary still appears whole in the neighboring chunk.

# --- Embeddings (M2-M3) ------------------------------------------------------------------------------
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
EMBEDDING_DIM = 1024  # why: bge-m3 outputs 1024 numbers per text. Must match vector(1024) in schema.sql.

# Candidates compared in M3. Some models were trained to expect a prefix that says "this is a question"
# vs "this is a document". Using the wrong (or no) prefix quietly lowers quality.
CANDIDATE_MODELS = ["intfloat/multilingual-e5-base", "BAAI/bge-m3", "AITeamVN/Vietnamese_Embedding"]
MODEL_PREFIXES: dict[str, tuple[str, str]] = {  # model -> (query prefix, passage prefix)
    "intfloat/multilingual-e5-base": ("query: ", "passage: "),
}

# --- Retrieval (M4-M5) -------------------------------------------------------------------------------
TOP_K = 5  # why: enough context to answer most questions while keeping the prompt short and fast. Tune with eval.
SIMILARITY_FLOOR = 0.35  # why: if even the best chunk scores below this, the documents likely don't cover the
#                          question, so we answer "I don't know" instead of letting the LLM guess. Tune with eval.

# --- Generation (M5) ---------------------------------------------------------------------------------
# Chat providers, rotated by rag/providers.py. A provider with no key (or no model id) in .env is skipped,
# so adding one means pasting two lines into .env, not editing code. They all speak the OpenAI chat format.
# Model ids are retired without notice: check each provider's console when one starts erroring.
CHAT_PROVIDERS = [
    {
        "name": "groq",
        "base_url": "https://api.groq.com/openai/v1",
        "api_key": os.getenv("GROQ_API_KEY", ""),
        "model": os.getenv("GROQ_CHAT_MODEL", ""),
    },
    {
        "name": "gemini",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key": os.getenv("GEMINI_API_KEY", ""),
        "model": os.getenv("GEMINI_CHAT_MODEL", ""),
    },
    {
        "name": "openrouter",
        "base_url": "https://openrouter.ai/api/v1",
        "api_key": os.getenv("OPENROUTER_API_KEY", ""),
        "model": os.getenv("OPENROUTER_CHAT_MODEL", ""),
    },
    {
        "name": "openrouter-2",  # a second free model on the same key: more budget, one more line
        "base_url": "https://openrouter.ai/api/v1",
        "api_key": os.getenv("OPENROUTER_API_KEY", ""),
        "model": os.getenv("OPENROUTER_CHAT_MODEL_2", ""),
    },
    {
        "name": "cerebras",
        "base_url": "https://api.cerebras.ai/v1",
        "api_key": os.getenv("CEREBRAS_API_KEY", ""),
        "model": os.getenv("CEREBRAS_CHAT_MODEL", ""),
    },
]
PROVIDER_COOLDOWN_SECONDS = 60  # why: free limits are measured per minute, so a minute of rest usually clears one.

GENERATION_TEMPERATURE = 0.1  # why: factual policy answers. Low randomness means the same question gets the same answer.
MAX_ANSWER_TOKENS = 400  # why: answers are spoken aloud to elderly users, so they should be short.

# --- Speech (M6) -------------------------------------------------------------------------------------
WHISPER_MODEL = "whisper-large-v3"  # why: strongest Whisper for Vietnamese. Check the exact id in Groq's model list.

# --- Secrets -----------------------------------------------------------------------------------------
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
