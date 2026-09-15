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

from config import GENERATION_TEMPERATURE, GROQ_API_KEY, GROQ_CHAT_MODEL, MAX_ANSWER_TOKENS

GENERATION_TIMEOUT_SECONDS = 8  # why: leaves room within Netlify's ~10 s request limit for embedding + search.


def generate_answer(messages: list[dict[str, str]]) -> str:
    """Call the Groq chat model and return the answer text.

    TODO(M5):
      1. from groq import Groq; client = Groq(api_key=GROQ_API_KEY, timeout=GENERATION_TIMEOUT_SECONDS)
      2. response = client.chat.completions.create(model=GROQ_CHAT_MODEL, messages=messages,
                                                   temperature=GENERATION_TEMPERATURE, max_tokens=MAX_ANSWER_TOKENS)
      3. Return response.choices[0].message.content.strip()
    """
    raise NotImplementedError("M5: implement generate_answer")
