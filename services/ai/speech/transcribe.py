"""
What it does:  Converts a recorded voice question into text with Whisper (hosted on Groq).
Concept:       Speech-to-text is a separate model from the LLM. Whisper detects the language automatically,
               so one call handles Vietnamese and English. The file name's extension tells the API the audio
               format: iPhones record audio/mp4 (.m4a/.mp4), Chrome records audio/webm (.webm).
Why this design: One small I/O function. Voice stays optional: text questions skip this file entirely.
               Temporary Groq trouble becomes SpeechUnavailable, so the API can answer 503 ("try again")
               instead of a 500 that looks like a bug. A rejected key stays a 500: that is our mistake.
Inputs/Outputs: audio bytes + filename -> transcript text ("" if nothing was understood).
Common pitfalls:
  - Sending audio with the wrong extension, so the API can't decode it.
  - Treating an empty transcript as a question. The caller should ask the user to try again.
  - Whisper invents text for silence (in Vietnamese, often a YouTube-style "subscribe to the channel" line),
    so an empty-transcript check alone won't catch a silent recording.
"""

from functools import lru_cache

import groq
from groq import Groq

from config import GROQ_API_KEY, TRANSCRIBE_TIMEOUT_SECONDS, WHISPER_MODEL


class SpeechUnavailable(Exception):
    """Whisper is temporarily unreachable (rate limit, timeout, network, 5xx). The user can try again."""


@lru_cache(maxsize=1)
def client() -> Groq:
    """One Groq client for the whole process, so the TLS connection is reused between recordings."""
    # max_retries=0: a retry would not fit the ~10 s budget. The user taps the mic again instead.
    return Groq(api_key=GROQ_API_KEY, timeout=TRANSCRIBE_TIMEOUT_SECONDS, max_retries=0)


def transcribe(audio: bytes, filename: str) -> str:
    """Return the transcript of a short recording."""
    try:
        result = client().audio.transcriptions.create(file=(filename, audio), model=WHISPER_MODEL)
    except (groq.RateLimitError, groq.APIConnectionError, groq.InternalServerError) as error:
        # APIConnectionError includes timeouts; InternalServerError is any 5xx.
        raise SpeechUnavailable(str(error)) from error
    return result.text.strip()
