import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. The people themselves are rows in Supabase (schema.sql).
export const STRINGS = {
  title: { en: "Staff", vi: "Danh bạ" } satisfies Text, // the page's title and its tile on Home ("Danh bạ": the user, 2026-10-19)
};
