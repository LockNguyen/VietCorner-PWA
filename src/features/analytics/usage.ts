import type { Service, Usage } from "./types";

// Where these rows are sent; left out of the counts so the tracker does not measure itself.
const OWN_ROUTE = "/api/analytics/";

const SUPABASE_SERVICES: Record<string, Service> = {
  rest: "database",
  storage: "storage",
  auth: "auth",
  functions: "functions",
};

// An address without its query: the query carries filters, ids and signed tokens, none of which belong in a log.
export function pathOf(url: string): string {
  return new URL(url).pathname;
}

// Which service a request went to, by its address. Null for other sites (a map) and for the tracker itself.
export function serviceOf(url: string, supabaseOrigin: string, appOrigin: string): Service | null {
  const { origin, pathname } = new URL(url);
  if (origin === supabaseOrigin) return SUPABASE_SERVICES[pathname.split("/")[1]] ?? null;
  if (origin !== appOrigin || pathname.startsWith(OWN_ROUTE)) return null;
  return pathname.startsWith("/api/") ? "api" : "files";
}

// Adds one finished request to `usage`, in place.
export function countRequest(usage: Usage, service: Service, ms: number, bytes: number) {
  const total = (usage[service] ??= { requests: 0, ms: 0, bytes: 0 });
  total.requests += 1;
  total.ms += Math.round(ms);
  total.bytes += bytes;
}
