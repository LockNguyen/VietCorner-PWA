"""
What it does:  Defines the data that flows through the RAG pipeline, one type per stage.
Concept:       A RAG pipeline is a series of transformations:
                   PDF -> Page -> Chunk -> EmbeddedChunk -> (stored) -> RetrievedChunk -> Generation -> Answer
               Naming each stage makes every function signature tell you where it sits in the pipeline.
Why this design: Frozen dataclasses are plain, typed, immutable records. No framework, easy to print and test.
               The file is named domain.py, not types.py, because a local "types.py" would shadow Python's
               built-in `types` module and break imports in confusing ways.
Inputs/Outputs: None. Pure type definitions.
Common pitfalls: Losing metadata (document name, page number) early in the pipeline. Without it you can't
               cite sources, and users can't verify answers.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Page:
    """Text of one PDF page. page_number starts at 1, like printed page numbers."""

    document: str  # file name, e.g. "volunteer_policy.pdf"
    page_number: int
    text: str


@dataclass(frozen=True)
class Chunk:
    """A small, searchable piece of a page. Chunks are what we embed and retrieve."""

    document: str
    page_number: int
    chunk_index: int  # position within the document (0, 1, 2, ...). Makes each chunk uniquely identifiable.
    text: str


@dataclass(frozen=True)
class EmbeddedChunk:
    """A chunk plus its embedding: a list of numbers that captures the chunk's meaning."""

    chunk: Chunk
    embedding: list[float]


@dataclass(frozen=True)
class RetrievedChunk:
    """A chunk returned by search, with its cosine similarity to the question (higher = more relevant)."""

    chunk: Chunk
    similarity: float


@dataclass(frozen=True)
class Source:
    """What we show the user so they can verify an answer."""

    document: str
    page_number: int
    similarity: float


@dataclass(frozen=True)
class Generation:
    """What the chat model wrote, and which provider wrote it.

    Returned (never stored on the shared ProviderPool) so that two simultaneous requests can't read each
    other's provider name.
    """

    text: str
    provider: str  # config.CHAT_PROVIDERS name, e.g. "groq" or "openrouter-2"


@dataclass
class Answer:
    """The final result of answer_question(). timings are in milliseconds per stage."""

    text: str
    provider: str  # who wrote the text; "" when we refused before calling any LLM
    sources: list[Source]
    timings: dict[str, float] = field(default_factory=dict)
