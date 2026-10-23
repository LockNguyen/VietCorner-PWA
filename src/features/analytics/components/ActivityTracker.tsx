"use client";

import { useErrorTracking } from "../hooks/useErrorTracking";
import { useKeptEvents } from "../hooks/useKeptEvents";
import { usePageTracking } from "../hooks/usePageTracking";
import { useResourceUsage } from "../hooks/useResourceUsage";
import { useTapTracking } from "../hooks/useTapTracking";
import { useVitals } from "../hooks/useVitals";

// Records how the signed-in person uses the app, for the admin's dashboard. Draws nothing; once, in the root layout.
export default function ActivityTracker({ userId }: { userId: string }) {
  const lastTap = useTapTracking();
  const takeUsage = useResourceUsage();
  usePageTracking(lastTap, takeUsage);
  useErrorTracking();
  useVitals();
  useKeptEvents(userId);
  return null;
}
