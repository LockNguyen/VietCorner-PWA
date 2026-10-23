import { createClient } from "@/lib/supabase/client";
import { getTimeline, type Report } from "./reads";
import { EVENTS_PER_REQUEST, sinceOf, type AnalyticsEvent, type Range } from "./types";

// ALL browser → backend calls for this feature.

// Sends recorded events to our route. sendBeacon, because the browser finishes it even while the app is being
// closed, which is exactly when the last screen's time is recorded. Returns the events the browser would not
// take (its queue full), for the queue to keep.
export function sendEvents(events: AnalyticsEvent[]): AnalyticsEvent[] {
  const refused: AnalyticsEvent[] = [];
  for (let start = 0; start < events.length; start += EVENTS_PER_REQUEST) {
    const batch = events.slice(start, start + EVENTS_PER_REQUEST);
    const taken = navigator.sendBeacon("/api/analytics/record", new Blob([JSON.stringify(batch)], { type: "application/json" }));
    if (!taken) refused.push(...batch);
  }
  return refused;
}

// GET a dashboard report again, as its page first read it, for the list to refresh itself on arrival
// (hooks/useFreshReport.ts). The period is counted back from now, so a refresh also moves it forward.
export function readReport<Row>(report: Report<Row>, days: Range): Promise<Row> {
  return report(createClient(), sinceOf(days));
}

// GET one person's events again (the timeline screen), the same way.
export function readTimeline(userId: string, days: Range): Promise<AnalyticsEvent[]> {
  return getTimeline(createClient(), userId, sinceOf(days));
}
