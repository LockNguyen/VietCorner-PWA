-- ASSISTANT feature schema. Run once in Supabase → SQL Editor.
--
-- This is the project's first SERVER-ONLY table: it has no grants and no RLS policies, so the browser
-- cannot read it even with the public anon key. Only the AI service reaches it, over its own Postgres
-- connection string (DATABASE_URL, stored on the VM).
--
-- Vector size 1024 = BAAI/bge-m3, chosen in the M3 bake-off (see .claude/architecture.md Key Decisions).
-- Changing the embedding model changes this number and requires re-ingesting every document.

-- 1. Extension -------------------------------------------------------------------------------------
-- pgvector adds the `vector` column type and the distance operators. On Supabase you can also enable it
-- from Database → Extensions. It lives in the `extensions` schema, which is on the default search path.
create extension if not exists vector with schema extensions;

-- 2. Table -----------------------------------------------------------------------------------------
create table public.document_chunks (
  id bigint generated always as identity primary key,
  document text not null,       -- file name, e.g. "Course 2 Ver 7.2 December 3.2025.pdf"
  page_number int not null,     -- 1-based, matches the printed page, so answers can cite it
  chunk_index int not null,     -- position within the document
  text text not null,
  embedding extensions.vector(1024) not null,
  created_at timestamptz not null default now(),
  -- Lets re-ingestion replace a document's chunks without creating duplicates.
  unique (document, chunk_index)
);

-- 3. Indexes ---------------------------------------------------------------------------------------
-- HNSW = a graph index for approximate nearest-neighbour search. Without it, every question compares the
-- query against every row; with it, Postgres walks a small part of the graph.
-- `vector_cosine_ops` must match the operator used when searching: `<=>` (cosine distance).
create index document_chunks_embedding_idx
  on public.document_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- Used by re-ingestion (delete every chunk of one document).
create index document_chunks_document_idx on public.document_chunks (document);

-- 4. Permissions -----------------------------------------------------------------------------------
-- RLS is on with NO policies: that denies every role which does not bypass RLS, which is exactly what we
-- want. The AI service connects with a role that bypasses it; browsers never can.
alter table public.document_chunks enable row level security;
revoke all on public.document_chunks from anon, authenticated;

-- To remove the feature, run:
-- drop table if exists public.document_chunks;
