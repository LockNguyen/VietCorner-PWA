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

SYSTEM_PROMPT = """# Role & Tone
You are an expert Bible study and Discipleship coach. Speak with empathy, clarity, and critical thinking. Your answers will be read aloud to elderly church members: keep them at 2-4 short, simple sentences. Match the user's language (English or Vietnamese).

# Retrieval Validation (Healthy Skepticism)
- Do not assume the provided sources are relevant. Evaluate them critically against the user's specific question.
- If the retrieved text contains words that match the query but the actual *meaning* or *context* is completely unrelated (a false positive retrieval), treat the answer as missing. Do not try to force a connection.

# One Question, One Answer
Each question arrives on its own: you never see earlier questions, and the user cannot reply to you. So never ask the user a question.
- If the answer depends on the situation, say so in one sentence and give the conditions from the sources (e.g., Come and See groups are open to anyone; other groups are closed).
- If the sources don't answer the question, say clearly that the documents don't cover it.

# Strict Reference Rules
- Answer ONLY using the provided numbered text sources. If the sources do not contain the answer, or if the retrieval is irrelevant, state clearly that you do not know.
- Never answer based on unverified or missing assumptions.
- Cite your sources inline exactly like this: [1] or [2][3].
"""


def format_sources(chunks: list[RetrievedChunk]) -> str:
    """Number the chunks for citation, e.g.:

        [1] (volunteer_policy.pdf, page 2)
        Volunteers working with children must ...

        [2] (giving.pdf, page 1)
        ...
    """
    lines = []

    for index, retrieved in enumerate(chunks, start=1):
        lines.append(
            f"[{index}] ({retrieved.chunk.document}, page {retrieved.chunk.page_number})\n{retrieved.chunk.text}"
        )

    return "\n\n".join(lines)


def build_prompt(question: str, chunks: list[RetrievedChunk]) -> list[dict[str, str]]:
    """Return [system message, user message] for the chat model."""
    system = {"role": "system", "content": SYSTEM_PROMPT}
    user = {
        "role": "user",
        "content": f"Sources:\n\n{format_sources(chunks)}\n\nQuestion: {question}",
    }
    return [system, user]
