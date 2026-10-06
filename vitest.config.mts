import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests for the assistant's pure modules: the error table, citation stripping, storage and the retry
// backoff. Components and hooks are not tested here on purpose — that would need a DOM testing library,
// and this MVP verifies the UI by running it (see the feature README).
export default defineConfig({
  // The same "@/..." shortcut the app uses (tsconfig.json), for tested modules that import a value, not
  // just a type, from another folder.
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
