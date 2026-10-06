import { LANGUAGES, type Language } from "@/features/i18n/types"; // I18N
import { toInstant, wallTime } from "./churchTime";
import type { EventDraft, EventText, ManagedEvent } from "./types";

// The event form's contents, and the two translations around it: a stored event → what the form shows,
// and what the form holds → the rows to store. Pure, so the church-time conversion is tested without a form.
//
// The form works in wall time ("2026-10-12T19:00", what a datetime-local input holds); the database stores
// instants. Converting in one place is what keeps "7 PM" meaning 7 PM in Winston-Salem on every device.

const NO_TEXT = { title: "", description: "", location: "" };

export function emptyDraft(): EventDraft {
  return {
    groupId: null,
    startsAt: "",
    endsAt: "",
    repeatsWeekly: false,
    repeatUntil: "",
    texts: { en: { ...NO_TEXT }, vi: { ...NO_TEXT } },
  };
}

export function draftOf(event: ManagedEvent): EventDraft {
  const textIn = (language: Language) => ({
    title: event.texts[language]?.title ?? "",
    description: event.texts[language]?.description ?? "",
    location: event.texts[language]?.location ?? "",
  });

  return {
    groupId: event.group_id,
    startsAt: wallTime(new Date(event.starts_at)),
    endsAt: event.ends_at ? wallTime(new Date(event.ends_at)) : "",
    repeatsWeekly: event.repeats_weekly,
    repeatUntil: event.repeat_until ?? "",
    texts: { en: textIn("en"), vi: textIn("vi") },
  };
}

// Why the draft cannot be saved yet, or null when it can. Named by cause; strings.ts has the words.
export type DraftProblem = "noTitle" | "noStart" | "endsBeforeItStarts";

export function problemWith(draft: EventDraft): DraftProblem | null {
  if (LANGUAGES.every((language) => draft.texts[language].title.trim() === "")) return "noTitle";
  if (draft.startsAt === "") return "noStart";
  if (draft.endsAt !== "" && draft.endsAt <= draft.startsAt) return "endsBeforeItStarts"; // same shape, so text order is time order
  return null;
}

// The `events` columns for this draft. A weekly-only field is cleared when the event is not weekly, so a
// leftover "repeat until" cannot cut off an event that no longer repeats.
export function rowOf(draft: EventDraft) {
  return {
    group_id: draft.groupId,
    starts_at: toInstant(draft.startsAt).toISOString(),
    ends_at: draft.endsAt ? toInstant(draft.endsAt).toISOString() : null,
    repeats_weekly: draft.repeatsWeekly,
    repeat_until: draft.repeatsWeekly && draft.repeatUntil ? draft.repeatUntil : null,
  };
}

// The `event_texts` row for one language, or null when that language has no title: an untitled translation
// is not stored, and readers of that language fall back to the other one.
export function textOf(draft: EventDraft, language: Language): EventText | null {
  const text = draft.texts[language];
  if (text.title.trim() === "") return null;

  return {
    title: text.title.trim(),
    description: text.description.trim() || null,
    location: text.location.trim() || null,
  };
}
