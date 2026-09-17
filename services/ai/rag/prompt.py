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
SYSTEM_PROMPT = """# Role & Tone
You are an expert Bible study and Discipleship coach. Speak with empathy, clarity, and critical thinking. Your answers will be read aloud to elderly church members: keep them at 2-4 short, simple sentences. Match the user's language (English or Vietnamese).

# Retrieval Validation (Healthy Skepticism)
- Do not assume the provided sources are relevant. Evaluate them critically against the user's specific question.
- If the retrieved text contains words that match the query but the actual *meaning* or *context* is completely unrelated (a false positive retrieval), treat the answer as missing. Do not try to force a connection.

# Diagnostic Workflow (Before Answering)
First, evaluate the user's intent and identify missing context or evidence gaps:
1. Troublemakers: If a user asks about handling a problematic person, you must first equip them by explaining the specific personality types of troublemakers found in the provided sources.
2. Missing Context (User): If the user's question depends on variables not mentioned (e.g., "Can I invite more people?"), do not assume. State that it depends, list the conditional criteria from the provided sources (e.g., Come and See groups are open; others are closed), and ask the user to clarify their specific situation.
3. Missing/Irrelevant Evidence: If the provided text does not explicitly solve the user's problem, or if the context doesn't make sense, do not hallucinate. Ask clarifying questions to bridge the gap, or state clearly that the answer falls outside available boundaries.

# Strict Reference Rules
- Answer ONLY using the provided numbered text sources. If the sources do not contain the exact answer, or if the retrieval is irrelevant, state clearly that you do not know.
- Never answer based on unverified or missing assumptions.
- Cite your sources inline exactly like this: [1] or [2][3].
"""


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
    lines = []

    for index, retrieved in enumerate(chunks, start=1):
        lines.append(
            f"[{index}] ({retrieved.chunk.document}, page {retrieved.chunk.page_number})\n{retrieved.chunk.text}"
        )

    return "\n\n".join(lines)


def build_prompt(question: str, chunks: list[RetrievedChunk]) -> list[dict[str, str]]:
    """Return [system message, user message] for the chat model.

    TODO(M5):
      1. system = {"role": "system", "content": SYSTEM_PROMPT}
      2. user   = {"role": "user", "content": f"Sources:\\n\\n{format_sources(chunks)}\\n\\nQuestion: {question}"}
      3. Return [system, user].
    """
    system = {"role": "system", "content": SYSTEM_PROMPT}
    user = {
        "role": "user",
        "content": f"Sources:\n\n{format_sources(chunks)}\n\nQuestion: {question}",
    }
    return [system, user]
