# Embedding model comparison

Question set: `evaluation/questions.jsonl`. Retrieval is scored at page level, top 5.

| Model | Recall@5 | Recall vi | Recall en | MRR | max sim (unanswerable) | p50 ms | p95 ms |
|---|---|---|---|---|---|---|---|
| BAAI/bge-m3 | 0.54 | 0.49 | 0.73 | 0.56 | 0.61 | 127 | 164 |
| AITeamVN/Vietnamese_Embedding | 0.52 | 0.43 | 0.83 | 0.44 | 0.46 | 114 | 131 |
| intfloat/multilingual-e5-base | 0.44 | 0.33 | 0.85 | 0.36 | 0.81 | 49 | 57 |

**Reading this table:** choose by MRR and Recall, then check the language columns, because an average can
hide a weak language. `max sim (unanswerable)` is the highest similarity reached by a question the documents
cannot answer, so `SIMILARITY_FLOOR` must sit above it or the assistant will answer questions it should refuse.
