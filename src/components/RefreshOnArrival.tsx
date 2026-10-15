"use client";

import { useOnArrival } from "@/lib/useOnArrival";
import { useRefresh } from "@/lib/useRefresh";

// Reloads the page's server data on arrival and on return to the app. For admin editors whose switches show
// what another screen may have changed since this page was kept (staleTimes); a stale switch undoes a change.
export default function RefreshOnArrival() {
  const refresh = useRefresh();
  useOnArrival(() => void refresh());
  return null;
}
