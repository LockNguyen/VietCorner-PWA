"use client";

import { useMemo } from "react";
import { useFresh } from "@/lib/useFresh";
import { readReport, readTimeline } from "../api";
import type { Report } from "../reads";
import type { AnalyticsEvent, Range } from "../types";

// A dashboard list as every list in the app works (the user, 2026-10-22): what the page loaded at once, then the
// same report read again on arrival and on return to the app, swapped in quietly. The read is made once per
// report and period, because `useFresh` knows a list by its read.
export function useFreshReport<Row>(loaded: Row, report: Report<Row>, days: Range): Row {
  const read = useMemo(() => () => readReport(report, days), [report, days]);
  return useFresh(loaded, read);
}

// The same for one person's timeline.
export function useFreshTimeline(loaded: AnalyticsEvent[], userId: string, days: Range): AnalyticsEvent[] {
  const read = useMemo(() => () => readTimeline(userId, days), [userId, days]);
  return useFresh(loaded, read);
}
