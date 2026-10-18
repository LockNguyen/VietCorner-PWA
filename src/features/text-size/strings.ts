import type { Text } from "@/features/i18n/types"; // I18N
import type { TextSize } from "./types";

// Every word this feature shows a user, in both languages.
export const STRINGS = {
  heading: { en: "Text size", vi: "Cỡ chữ" } satisfies Text,
};

// The two choices, in the order shown: as the app was, then bigger.
export const SIZES: { size: TextSize; label: Text }[] = [
  { size: "compact", label: { en: "Compact", vi: "Gọn" } },
  { size: "big", label: { en: "Big text", vi: "Chữ to" } },
];
