"""
What it does:  Sends the prompt messages to a chat model on Groq and returns the answer text.
Concept:       The LLM is the "generation" in Retrieval-Augmented Generation. It doesn't know our documents;
               it only reads the sources we put in the prompt. Low temperature makes it stick to them.
Why this design: The only file that knows about Groq. Switching providers (or to a local model) changes this
               file, nothing else.
Inputs/Outputs: messages -> answer text.
Common pitfalls:
  - Creating a new client per call is fine here; creating one at import time breaks tests that lack a key.
  - Not setting a timeout: a slow provider would exceed the web app's ~10 s budget.
"""

from typing import List, cast

from config import (
    GENERATION_TEMPERATURE,
    GROQ_API_KEY,
    GROQ_CHAT_MODEL,
    MAX_ANSWER_TOKENS,
)
from groq import Groq
from groq.types.chat import ChatCompletionMessageParam

GENERATION_TIMEOUT_SECONDS = (
    8  # why: leaves room within Netlify's ~10 s request limit for embedding + search.
)


def generate_answer(messages: list[dict[str, str]], model_name: str = GROQ_CHAT_MODEL) -> str:
    """Call a Groq chat model and return the answer text. `model_name` defaults to the configured one."""
    # Should lru_cache this like the embedding models as well?
    client = Groq(api_key=GROQ_API_KEY, timeout=GENERATION_TIMEOUT_SECONDS)
    response = client.chat.completions.create(
        model=model_name,
        messages=cast(List[ChatCompletionMessageParam], messages),
        temperature=GENERATION_TEMPERATURE,
        max_tokens=MAX_ANSWER_TOKENS,
    )

    answer = response.choices[0].message.content

    if answer is None:
        return "I am sorry, but I was unable to generate an answer."

    return answer.strip()
