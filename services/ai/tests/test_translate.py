"""Translating prayer requests: the prompt, reading the model's JSON, and the orchestrator. Fakes, no network."""

import pytest

from domain import Generation, Translation
from translation.translate import TranslationFailed, build_translate_messages, parse_translation, translate

REQUEST = "Xin cầu nguyện cho ba tôi đang nằm viện."


def answering(text: str):
    """A stand-in generator that always returns `text`, and records the messages it was asked."""
    calls = []

    def generate(messages):
        calls.append(messages)
        return Generation(text, "fake")

    generate.calls = calls
    return generate


def test_only_the_request_text_reaches_the_model():
    messages = build_translate_messages(REQUEST)

    assert messages[0]["role"] == "system"
    assert messages[1] == {"role": "user", "content": f"Request: {REQUEST}"}


def test_returns_the_language_and_the_translation():
    generate = answering('{"language": "vi", "translation": "Please pray for my father in hospital."}')

    assert translate(REQUEST, generate=generate) == Translation(
        "vi", "Please pray for my father in hospital.", "fake"
    )
    assert REQUEST in generate.calls[0][1]["content"]


def test_reads_json_wrapped_in_a_code_fence_or_a_sentence():
    answer = 'Here it is:\n```json\n{"language": "en", "translation": "Xin cầu nguyện cho tôi."}\n```'

    assert parse_translation(answer) == ("en", "Xin cầu nguyện cho tôi.")


def test_keeps_line_breaks_inside_the_translation():
    raw = '{"language": "en", "translation": "Dòng một\nDòng hai"}'  # a real line break, as models write it
    escaped = '{"language": "en", "translation": "Dòng một\\nDòng hai"}'  # JSON's own "\n"

    assert parse_translation(raw)[1] == "Dòng một\nDòng hai"
    assert parse_translation(escaped)[1] == "Dòng một\nDòng hai"


@pytest.mark.parametrize("answer", [
    "Please pray for my father.",  # no JSON at all
    '{"language": "vi", "translation": "cut off',  # ran out of tokens
    '{"language": "fr", "translation": "Priez pour moi."}',  # neither of our languages
    '{"language": "vi", "translation": "   "}',  # empty
    '{"language": "vi"}',  # missing
    '["vi", "Please pray"]',  # not an object
])
def test_rejects_anything_that_is_not_a_usable_translation(answer):
    with pytest.raises(TranslationFailed):
        parse_translation(answer)


def test_a_bad_answer_raises_instead_of_being_shown():
    with pytest.raises(TranslationFailed):
        translate(REQUEST, generate=answering("Amen."))
