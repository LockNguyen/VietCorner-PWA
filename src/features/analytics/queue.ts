import { SWITCHES } from "@/lib/switches";
import { sendEvents } from "./api";
import { EVENTS_PER_REQUEST, type AnalyticsEvent, type Kind } from "./types";

// What this phone has recorded and not sent yet. Module state, not React state: the Supabase client's fetch,
// the banners and the tracker all record, and they do not share a component.
//
// When it is sent (the user, 2026-10-22: fewer requests, nothing lost): when the app is put away
// (usePageTracking), and as soon as one request's worth has built up (EVENTS_PER_REQUEST), not on a timer. A
// visit is then one or two requests instead of one every 30 s. Until sent it is also kept on the phone, under the
// signed-in person's id (`keepFor`), so what an ended app (a crash, a flat battery) or a lost signal left unsent
// goes at the next opening, and on a shared phone never as someone else's.
const waiting: AnalyticsEvent[] = [];
// why: a phone that cannot send for a long while keeps its newest events, not all of them.
const MAX_WAITING = 500;
let owner: string | null = null; // whose events these are, once known: the queue is kept on the phone for them
const keyOf = (userId: string) => `vietcorner.analytics.unsent.${userId}`;
let visitId = crypto.randomUUID();

type Fields = { path?: string; target?: string | null; ms?: number | null; detail?: Record<string, unknown> };

// Notes one thing that happened, on the screen showing now unless `path` says otherwise.
export function record(kind: Kind, { path = location.pathname, target = null, ms = null, detail = {} }: Fields = {}) {
  if (!SWITCHES.analytics) return;
  waiting.push({
    visit_id: visitId,
    at: new Date().toISOString(),
    kind,
    path,
    target: target?.slice(0, 300) ?? null,
    ms: ms === null ? null : Math.round(ms),
    detail,
  });
  if (waiting.length > MAX_WAITING) waiting.shift();
  if (waiting.length >= EVENTS_PER_REQUEST) sendAll();
  else keep();
}

// Sends everything recorded so far. Offline it waits for the next chance (the next put-away or opening): the
// browser drops a beacon it cannot deliver and never tries again.
export function sendAll() {
  if (!navigator.onLine) return keep();
  waiting.push(...sendEvents(waiting.splice(0)));
  keep();
}

// Called once the signed-in person is known (ActivityTracker): their events left unsent last time join the
// queue, and are sent now; from now on the queue is kept on the phone for them.
export function keepFor(userId: string) {
  if (owner === userId) return; // already theirs: reading the kept events again would send them twice
  owner = userId;
  waiting.unshift(...readKept(userId));
  waiting.splice(0, Math.max(0, waiting.length - MAX_WAITING));
  if (waiting.length > 0) sendAll();
}

// Never throws: storage can be unavailable (private mode) or full; the queue then lives in memory only, as before.
function keep() {
  if (!owner) return;
  try {
    localStorage.setItem(keyOf(owner), JSON.stringify(waiting));
  } catch {
    // Not kept: a crash before the next send loses this visit's last events.
  }
}

function readKept(userId: string): AnalyticsEvent[] {
  try {
    const kept: unknown = JSON.parse(localStorage.getItem(keyOf(userId)) ?? "[]");
    return Array.isArray(kept) ? kept : [];
  } catch {
    return [];
  }
}

// Starts a new visit: the person is back after NEW_VISIT_AFTER_MS away.
export function startNewVisit() {
  visitId = crypto.randomUUID();
}
