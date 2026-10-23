import type { Language } from "@/features/i18n/types"; // I18N
import type { PrayerRequest } from "./types";

// The words a reader sees for a request: the approved translation when it was written in the other language,
// otherwise the request as written. The author too (the user, 2026-10-23: their own English request should read in
// their Vietnamese). The view sends a translation only once an admin approved it (schema.sql 5d), so an unreviewed
// one can never be picked here.
type Shown = Pick<PrayerRequest, "body" | "language" | "translation">;

export function shownText(request: Shown, reader: Language): string {
  const writtenInAnother = request.language !== null && request.language !== reader;
  return writtenInAnother && request.translation ? request.translation : request.body;
}
