import { defineConfig } from "vitest/config";

// The RLS tests are separate from `npm test` on purpose: they talk to the real Supabase project, need the
// service-role key from .env.local, and create then delete two throwaway users. Run them with
// `npm run test:rls` after changing any schema.sql, and in the pull request that adds a table.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rls.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false, // one shared project: parallel writes would fight over the same rows
  },
});
