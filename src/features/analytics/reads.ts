import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActionStats,
  AnalyticsEvent,
  ErrorStats,
  Overview,
  PageStats,
  PathStats,
  PersonStats,
  RepeatedTapStats,
  SlowStats,
  UsageStats,
  VitalStats,
} from "./types";

// The dashboard's reads, for both sides: the pages on the server (server/queries.ts) and each list refreshing
// itself in the browser (api.ts, hooks/useFreshReport.ts). Each is empty for anyone without "analytics.view", and
// before schema.sql has been run.

// A report over a period: the shape every list's read has, so one hook refreshes any of them.
export type Report<Row> = (supabase: SupabaseClient, since: string) => Promise<Row>;

async function report<Row>(supabase: SupabaseClient, name: string, since: string): Promise<Row[]> {
  const { data, error } = await supabase.rpc(name, { since });
  if (error) return [];
  return data;
}

export async function getOverview(supabase: SupabaseClient, since: string): Promise<Overview | null> {
  const [overview] = await report<Overview>(supabase, "analytics_overview", since);
  return overview ?? null;
}

export function getPageStats(supabase: SupabaseClient, since: string) {
  return report<PageStats>(supabase, "analytics_pages", since);
}

export function getPeopleStats(supabase: SupabaseClient, since: string) {
  return report<PersonStats>(supabase, "analytics_people", since);
}

export function getPathStats(supabase: SupabaseClient, since: string) {
  return report<PathStats>(supabase, "analytics_paths", since);
}

export function getErrorStats(supabase: SupabaseClient, since: string) {
  return report<ErrorStats>(supabase, "analytics_errors", since);
}

export function getSlowStats(supabase: SupabaseClient, since: string) {
  return report<SlowStats>(supabase, "analytics_slow", since);
}

export function getRepeatedTapStats(supabase: SupabaseClient, since: string) {
  return report<RepeatedTapStats>(supabase, "analytics_repeated_taps", since);
}

export function getVitalStats(supabase: SupabaseClient, since: string) {
  return report<VitalStats>(supabase, "analytics_vitals", since);
}

export function getUsageStats(supabase: SupabaseClient, since: string) {
  return report<UsageStats>(supabase, "analytics_usage", since);
}

// How often each named action (praying, the music) was used, and by how many people (schema.sql 4b).
export function getActionStats(supabase: SupabaseClient, since: string) {
  return report<ActionStats>(supabase, "analytics_actions", since);
}

// The Problems screen's four reports, read together (none needs another's answer), as one value to refresh.
export async function getProblems(supabase: SupabaseClient, since: string): Promise<Problems> {
  const [errors, slow, repeated, vitals] = await Promise.all([
    getErrorStats(supabase, since),
    getSlowStats(supabase, since),
    getRepeatedTapStats(supabase, since),
    getVitalStats(supabase, since),
  ]);
  return { errors, slow, repeated, vitals };
}

export type Problems = { errors: ErrorStats[]; slow: SlowStats[]; repeated: RepeatedTapStats[]; vitals: VitalStats[] };

// One person's events, newest first: what they did, screen by screen. Capped so a busy month stays one read.
export async function getTimeline(supabase: SupabaseClient, userId: string, since: string): Promise<AnalyticsEvent[]> {
  const { data, error } = await supabase
    .from("analytics_events")
    .select("visit_id, at, kind, path, target, ms, detail")
    .eq("user_id", userId)
    .gte("at", since)
    .order("at", { ascending: false })
    .limit(300);
  if (error) return [];
  return data;
}
