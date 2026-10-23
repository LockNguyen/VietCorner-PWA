import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENTS_PER_REQUEST, KINDS, type AnalyticsEvent } from "../types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_MS = 24 * 60 * 60 * 1000;
// why: a phone's clock may be a little ahead; a time further off would dodge the 90-day cleanup.
const CLOCK_SLACK_MS = 5 * 60 * 1000;
const MAX_DETAIL_CHARS = 2000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// One event as the tracker sends it, or null. Only known fields are kept, so nothing else reaches the table.
function validEvent(value: unknown, now: number): AnalyticsEvent | null {
  if (!isObject(value)) return null;
  const { visit_id, at, kind, path, target, ms, detail } = value;
  const time = typeof at === "string" ? Date.parse(at) : NaN;
  const valid =
    typeof visit_id === "string" && UUID.test(visit_id) &&
    time > now - DAY_MS && time < now + CLOCK_SLACK_MS &&
    KINDS.includes(kind as AnalyticsEvent["kind"]) &&
    typeof path === "string" && path.startsWith("/") && path.length <= 200 &&
    (target === null || (typeof target === "string" && target.length <= 300)) &&
    (ms === null || (typeof ms === "number" && Number.isFinite(ms) && ms >= 0 && ms < DAY_MS)) &&
    isObject(detail) && JSON.stringify(detail).length <= MAX_DETAIL_CHARS;
  if (!valid) return null;
  return {
    visit_id: visit_id as string,
    at: new Date(time).toISOString(),
    kind: kind as AnalyticsEvent["kind"],
    path: path as string,
    target: target as string | null,
    ms: ms === null ? null : Math.round(ms as number),
    detail: detail as Record<string, unknown>,
  };
}

// What a phone sent, minus anything malformed. The browser is not trusted: a bad row is dropped, not stored.
export function validEvents(body: unknown, now = Date.now()): AnalyticsEvent[] {
  if (!Array.isArray(body)) return [];
  return body
    .slice(0, EVENTS_PER_REQUEST)
    .map((value) => validEvent(value, now))
    .filter((event) => event !== null);
}

// Stores the events as the signed-in user: the table's default fills user_id from their token.
export async function recordEvents(supabase: SupabaseClient, events: AnalyticsEvent[]) {
  if (events.length === 0) return;
  const { error } = await supabase.from("analytics_events").insert(events);
  if (error) throw error;
}
