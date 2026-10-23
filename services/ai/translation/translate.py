"""
What it does:  Tells whether a prayer request is Vietnamese or English, and translates it into the other language.
Concept:       One chat call does both jobs, answering in a fixed JSON shape: {"language": "vi"|"en",
               "translation": "..."}. Asking for a strict format turns a free-text model into a function we can
               check: anything that doesn't parse, names another language, or is empty is rejected, never shown.
Why this design: The same provider rotation as the assistant (rag/providers.py), so free tiers back each other up,
               but its own pool: a translation needs a longer answer and no randomness (config.TRANSLATION_*),
               and the shared `call_provider` takes those as settings. Two pools keep separate rest times, so a
               provider rate-limited by questions is tried once more by a translation before it rests here too:
               one wasted call, against threading settings through every fake in the pool's tests.
               Pure prompt building and parsing (tested without a network) + one orchestrator whose `generate`
               is injected. Nothing is logged here: the text is private, and the API logs sizes only.
               The web app shows a translation only after an admin approves it, so a poor one is caught.
Inputs/Outputs: request text -> Translation(language, text, provider). Raises TranslationFailed or
               AllProvidersFailed; the API answers 503 for both and the web app leaves the translation empty.
Common pitfalls:
  - Trusting the model's JSON. Small models wrap it in ```json fences or add a sentence; we read from the first
    "{" to the last "}" and still check every field.
  - Vietnamese typed without accents ("cau nguyen cho me toi") is still Vietnamese. The prompt says so.
  - Strict JSON forbids a raw line break inside a string, and models write one when the request has several
    lines. We parse with strict=False rather than lose those translations.
  - A cut-off answer (too few tokens) is broken JSON. Raise TRANSLATION_MAX_TOKENS, don't repair the JSON.
  - Sending the author's name. Only the request's text ever reaches a provider (the user, 2026-10-22).
"""

import json
from functools import lru_cache, partial
from typing import Protocol

from config import TRANSLATION_MAX_TOKENS, TRANSLATION_TEMPERATURE
from domain import Generation, Translation
from rag.generate import call_provider
from rag.providers import ProviderPool, load_providers

LANGUAGES = {"vi", "en"}


class TranslationFailed(Exception):
    """The model answered, but not with a usable translation. Temporary: another try may well work."""


class Generator(Protocol):
    """What translate needs: chat messages in, one answer out."""

    def __call__(self, messages: list[dict[str, str]]) -> Generation: ...


TRANSLATE_PROMPT = """You translate prayer requests in a Vietnamese church app, between Vietnamese and English.

Rules:
- Decide the language the request is written in: "vi" for Vietnamese (also when typed without accents),
  "en" for English. If it mixes both, choose the one most of it is written in.
- Translate it into the other language. Keep its meaning, its warmth, every name and its line breaks.
- Add nothing and explain nothing. Never answer the request or pray it yourself.
- Answer with JSON only, in exactly this shape: {"language": "vi", "translation": "..."}

Example
Request: Xin cầu nguyện cho mẹ tôi sắp mổ tim.
Answer: {"language": "vi", "translation": "Please pray for my mother, who is about to have heart surgery."}"""


def build_translate_messages(text: str) -> list[dict[str, str]]:
    """The chat messages that ask for the translation. Pure: no network."""
    return [
        {"role": "system", "content": TRANSLATE_PROMPT},
        {"role": "user", "content": f"Request: {text}"},
    ]


def parse_translation(answer: str) -> tuple[str, str]:
    """The (language, translation) in a model's answer. Raises TranslationFailed if any part is missing or wrong."""
    start, end = answer.find("{"), answer.rfind("}")
    if start == -1 or end < start:
        raise TranslationFailed("no JSON object in the answer")
    try:
        # strict=False accepts a raw line break inside the translation, which models write for a multi-line request.
        data = json.loads(answer[start : end + 1], strict=False)
    except json.JSONDecodeError:
        raise TranslationFailed("the answer's JSON does not parse") from None

    language = data.get("language") if isinstance(data, dict) else None
    translation = data.get("translation") if isinstance(data, dict) else None
    if language not in LANGUAGES:
        raise TranslationFailed(f"unknown language {language!r}")
    if not isinstance(translation, str) or not translation.strip():
        raise TranslationFailed("empty translation")
    return language, translation.strip()


@lru_cache(maxsize=1)
def translation_pool() -> ProviderPool:
    """The providers that have a key in .env, asked with the translation's settings. Built once."""
    call = partial(call_provider, temperature=TRANSLATION_TEMPERATURE, max_tokens=TRANSLATION_MAX_TOKENS)
    return ProviderPool(providers=load_providers(), call=call)


def generate_translation(messages: list[dict[str, str]]) -> Generation:
    """The real generator: the translation pool, within the usual deadline (config.GENERATION_DEADLINE_SECONDS)."""
    return translation_pool().generate(messages)


def translate(text: str, *, generate: Generator = generate_translation) -> Translation:
    """Detect the request's language and translate it into the other one."""
    generation = generate(build_translate_messages(text))
    language, translation = parse_translation(generation.text)
    return Translation(language, translation, generation.provider)
