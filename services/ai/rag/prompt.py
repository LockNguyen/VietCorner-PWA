"""
What it does:  Builds the messages sent to the LLM: rules + numbered sources + the question.
Concept:       "Grounding" means the model must answer ONLY from the provided sources, cite them as [1], [2],
               and say it doesn't know when the sources don't cover the question. This is the main defense
               against hallucination (confident, invented answers). Numbered sources let the UI show exactly
               which document and page support each claim.
Why this design: Pure functions, the most important code to unit-test, because prompt bugs are silent.
               The system prompt is a named constant, so prompt changes are reviewable diffs.
Inputs/Outputs: question + list[RetrievedChunk] -> list of {"role", "content"} messages (OpenAI/Groq chat format).
Common pitfalls:
  - Putting the rules in the user message, where they're easier for the question to override.
  - Unnumbered sources (the model can't cite what it can't refer to).
  - Long answers. They'll be spoken aloud to elderly users.
"""

from domain import RetrievedChunk

# TODO(M5): Write the rules in your own words. Include at least:
#   - Answer only using the numbered sources. If they don't contain the answer, say you don't know.
#   - Cite sources inline like [1] or [2][3].
#   - Reply in the same language as the question (Vietnamese or English).
#   - Keep answers to 2-4 short sentences; they will be read aloud to elderly church members.
SYSTEM_PROMPT = "TODO(M5): write the grounding rules"


def format_sources(chunks: list[RetrievedChunk]) -> str:
    """Number the chunks for citation, e.g.:

        [1] (volunteer_policy.pdf, page 2)
        Volunteers working with children must ...

        [2] (giving.pdf, page 1)
        ...

    TODO(M5):
      1. For each chunk with its 1-based number n: f"[{n}] ({document}, page {page_number})\\n{text}"
      2. Join the blocks with a blank line between them ("\\n\\n").
    """
    raise NotImplementedError("M5: implement format_sources")


def build_prompt(question: str, chunks: list[RetrievedChunk]) -> list[dict[str, str]]:
    """Return [system message, user message] for the chat model.

    TODO(M5):
      1. system = {"role": "system", "content": SYSTEM_PROMPT}
      2. user   = {"role": "user", "content": f"Sources:\\n\\n{format_sources(chunks)}\\n\\nQuestion: {question}"}
      3. Return [system, user].
    """
    raise NotImplementedError("M5: implement build_prompt")
