"""
What it does:  Converts a recorded voice question into text with Whisper (hosted on Groq).
Concept:       Speech-to-text is a separate model from the LLM. Whisper detects the language automatically,
               so one call handles Vietnamese and English. The file name's extension tells the API the audio
               format: iPhones record audio/mp4 (.m4a/.mp4), Chrome records audio/webm (.webm).
Why this design: One small I/O function. Voice stays optional: text questions skip this file entirely.
Inputs/Outputs: audio bytes + filename -> transcript text ("" if nothing was understood).
Common pitfalls:
  - Sending audio with the wrong extension, so the API can't decode it.
  - Treating an empty transcript as a question. The caller should ask the user to try again.
"""

from config import GROQ_API_KEY, WHISPER_MODEL


def transcribe(audio: bytes, filename: str) -> str:
    """Return the transcript of a short recording.

    TODO(M6):
      1. from groq import Groq; client = Groq(api_key=GROQ_API_KEY)
      2. result = client.audio.transcriptions.create(file=(filename, audio), model=WHISPER_MODEL)
      3. Return result.text.strip()
    """
    raise NotImplementedError("M6: implement transcribe")
