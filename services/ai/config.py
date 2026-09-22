"""
What it does:  Every tunable number and every setting of the AI service, in one place.
Concept:       RAG quality depends on a handful of knobs (chunk size, how many chunks to retrieve, when to
               refuse). Keeping them together makes experiments easy: change one value, re-run the evaluation.
Why this design: No magic numbers inside functions. Each constant says WHY it has its value (on the line above
               it), so a reader can challenge it with evidence (see evaluation/results.md).
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
# Your private PDFs (gitignored).
DATA_DIR = SERVICE_ROOT / "data"

# --- Chunking (M1) -----------------------------------------------------------------------------------
# We measure chunks in words, not model tokens, so chunking needs no tokenizer and stays a pure function.
# Vietnamese writes one syllable per space-separated "word", so word counts run higher than in English.

# why: roughly one policy rule or section. Long enough to keep context, short enough to stay on one topic.
CHUNK_WORDS = 300
# why: a sentence cut at a chunk boundary still appears whole in the neighboring chunk.
CHUNK_OVERLAP_WORDS = 50

# --- Embeddings (M2-M3) ------------------------------------------------------------------------------
# why: best at Vietnamese questions about English pages in the M3 bake-off (see architecture.md Key Decisions).
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3")
# why: bge-m3 outputs 1024 numbers per text. Must match vector(1024) in schema.sql.
EMBEDDING_DIM = 1024

# Candidates compared in M3. Some models were trained to expect a prefix that says "this is a question"
# vs "this is a document". Using the wrong (or no) prefix quietly lowers quality.
CANDIDATE_MODELS = ["intfloat/multilingual-e5-base", "BAAI/bge-m3", "AITeamVN/Vietnamese_Embedding"]
# model -> (query prefix, passage prefix)
MODEL_PREFIXES: dict[str, tuple[str, str]] = {
    "intfloat/multilingual-e5-base": ("query: ", "passage: "),
}

# --- Retrieval (M4-M5) -------------------------------------------------------------------------------
# why: enough context to answer most questions while keeping the prompt short and fast. Tune with eval.
TOP_K = 5
# why: a gibberish guard, not an answerability test (measured 2026-09-21, bge-m3, 41 eval questions). Real
# questions' best match is 0.41-0.75, unanswerable ones 0.51-0.61 (higher than some real ones!), off-topic
# 0.33-0.50. 0.35 refuses 0 real questions and catches gibberish ("asdf" 0.33, "capital of France" 0.34);
# 0.45 would already refuse a real one. Refusing everything else is the prompt's job.
SIMILARITY_FLOOR = 0.35
# why: a few questions at once at most; Supabase's free pooler allows only a small number of connections.
DB_POOL_MAX_SIZE = 4
# why: at startup, a wrong DATABASE_URL should crash the service within seconds, not hang the first question.
DB_CONNECT_TIMEOUT_SECONDS = 10

# --- Generation (M5) ---------------------------------------------------------------------------------
# Chat providers, asked IN THIS ORDER by rag/providers.py: put the fastest first; the rest are fallbacks used
# only while an earlier one is resting. A provider with no key (or no model id) in .env is skipped,
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
        # A second Groq model on the same key: Groq sets its rate limits per model, so this adds real headroom,
        # and it answers in ~1 s, which makes it the best fallback. It does NOT help if Groq itself is down.
        "name": "groq-2",
        "base_url": "https://api.groq.com/openai/v1",
        "api_key": os.getenv("GROQ_API_KEY", ""),
        "model": os.getenv("GROQ_CHAT_MODEL_2", ""),
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
        # A second model on the same key. On OpenRouter it adds no capacity: every free model shares one
        # 50-requests-per-day allowance. Leave OPENROUTER_CHAT_MODEL_2 empty unless you buy credits.
        "name": "openrouter-2",
        "base_url": "https://openrouter.ai/api/v1",
        "api_key": os.getenv("OPENROUTER_API_KEY", ""),
        "model": os.getenv("OPENROUTER_CHAT_MODEL_2", ""),
    },
    # {
    #     "name": "cerebras",
    #     "base_url": "https://api.cerebras.ai/v1",
    #     "api_key": os.getenv("CEREBRAS_API_KEY", ""),
    #     "model": os.getenv("CEREBRAS_CHAT_MODEL", ""),
    # },
]
# why: free limits are measured per minute, so a minute of rest usually clears one.
PROVIDER_COOLDOWN_SECONDS = 60
# why: a provider that keeps failing rests 60 s, 2 min, 4 min, 8 min, then 15 min at most. A long outage (Gemini
# timing out for minutes on 2026-09-22) then costs users almost nothing, and we still notice when it recovers.
PROVIDER_MAX_COOLDOWN_SECONDS = 15 * 60

# why: factual policy answers. Low randomness means the same question gets the same answer.
GENERATION_TEMPERATURE = 0.1
# why: answers are spoken aloud to elderly users, so they should be short.
MAX_ANSWER_TOKENS = 400
# why: Netlify ends the web app's route at ~10 s. Embed (~0.1 s) + search (~0.3 s) + the hop to this service leave
# ~7 s for the LLM, and that budget covers EVERY provider the pool tries, not each one.
GENERATION_DEADLINE_SECONDS = 7
# why: healthy answers take 0.7-1.8 s (measured). A provider silent for 4 s is probably stuck, and capping it
# leaves the next provider ~3 s instead of letting one slow provider burn the whole budget (seen: a 503 while
# Groq and Gemini were healthy).
PROVIDER_TIMEOUT_SECONDS = 4
# why: each LLM call runs on a background thread so we can stop waiting at the deadline. A call we gave up on keeps
# its thread until the provider finishes, so allow a few spare ones.
GENERATION_WORKERS = 8

# --- Speech (M6) -------------------------------------------------------------------------------------
# why: strongest Whisper for Vietnamese. Check the exact id in Groq's model list.
WHISPER_MODEL = "whisper-large-v3"
# why: same ~10 s budget as /ask; a short voice question transcribes in 1-2 s.
TRANSCRIBE_TIMEOUT_SECONDS = 8

# --- API (M6) ----------------------------------------------------------------------------------------
# why: a spoken question is a sentence or two. Anything longer is a bug or abuse, and costs tokens.
MAX_QUESTION_CHARS = 1000
# why: ~5 min of compressed audio, far more than one question. Groq's own cap is 25 MB.
MAX_AUDIO_BYTES = 10 * 1024 * 1024
# why: /docs is handy locally, but on a public Space it hands strangers a map of the API. Off unless set to 1.
SHOW_API_DOCS = os.getenv("SHOW_API_DOCS", "") == "1"

# --- Secrets -----------------------------------------------------------------------------------------
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
