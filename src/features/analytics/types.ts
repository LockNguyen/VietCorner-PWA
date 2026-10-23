// The permission that opens the dashboard (schema.sql gives it to "admin").
export const VIEW_ANALYTICS = "analytics.view";

export const KINDS = ["page", "click", "action", "error", "slow", "vital"] as const;
export type Kind = (typeof KINDS)[number];

// One row of `analytics_events` as a phone sends it; the database adds who and an id. What `target`, `ms`
// and `detail` hold depends on `kind` (schema.sql, section 2).
export type AnalyticsEvent = {
  visit_id: string;
  at: string; // ISO time by the phone's clock
  kind: Kind;
  path: string;
  target: string | null;
  ms: number | null;
  detail: Record<string, unknown>;
};

// Where a request went: four Supabase services, the app's own routes, and its own files (code, pictures).
export type Service = "database" | "storage" | "auth" | "functions" | "api" | "files";
export type Usage = Partial<Record<Service, { requests: number; ms: number; bytes: number }>>;

// why: past 3 s a tap feels broken, and elderly members tap again or give up.
export const SLOW_REQUEST_MS = 3000;
// why: the usual length of a web "session": back after half an hour away is a new visit.
export const NEW_VISIT_AFTER_MS = 30 * 60 * 1000;
// why: a tap more than 10 s before a screen appeared did not open it.
export const TAP_OPENS_WITHIN_MS = 10 * 1000;
// why: one request stays well under sendBeacon's 64 KB limit. Also when the queue sends without waiting for the
// app to be put away (queue.ts): a full request's worth.
export const EVENTS_PER_REQUEST = 50;

// The ranges the dashboard offers, in days; a week unless the address says otherwise (`?days=`).
export const RANGES = [1, 7, 30] as const;
export type Range = (typeof RANGES)[number];

export function rangeOf(days: unknown): Range {
  return RANGES.find((range) => String(range) === days) ?? 7;
}

// The start of the range, as the dashboard's reads take it.
export function sinceOf(days: Range, now = Date.now()): string {
  return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
}

// Rows of the dashboard's reads (schema.sql, section 4). Postgres counts arrive as numbers.
export type Overview = { people: number; visits: number; views: number; total_ms: number; errors: number; slow: number };
export type PageStats = { path: string; views: number; people: number; total_ms: number; p75_wait_ms: number | null; errors: number };
export type PersonStats = { user_id: string; visits: number; views: number; total_ms: number; last_at: string; errors: number };
export type PathStats = { from_path: string; via: string | null; to_path: string; times: number };
export type ErrorStats = { message: string; path: string; source: string; times: number; people: number; last_at: string };
export type SlowStats = { request: string; times: number; p75_ms: number; max_ms: number };
export type RepeatedTapStats = { path: string; target: string; times: number; visits: number };
export type VitalStats = { path: string; name: string; p75: number; readings: number; poor: number };
export type ActionStats = { action: string; times: number; people: number };
export type UsageStats = { user_id: string; service: Service; visits: number; requests: number; total_ms: number; bytes: number };
