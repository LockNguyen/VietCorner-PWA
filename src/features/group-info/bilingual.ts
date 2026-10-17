import type { Text } from "@/features/i18n/types"; // I18N
import type { DirectoryGroup } from "./types";

// A group's name and place as a `Text`, for `t()` to pick the reader's language. The Vietnamese is the
// group's own (`name`, `location`); the English is optional, and `t()` shows the other language while one
// is missing, the way an event written in one language still has a title.
export function nameText(group: DirectoryGroup): Text {
  return { vi: group.name, en: group.name_en ?? "" };
}

export function locationText(group: DirectoryGroup): Text {
  return { vi: group.location ?? "", en: group.location_en ?? "" };
}
