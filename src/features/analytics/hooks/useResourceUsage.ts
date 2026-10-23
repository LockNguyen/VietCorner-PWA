"use client";

import { useCallback, useEffect, useRef } from "react";
import { record } from "../queue";
import { SLOW_REQUEST_MS, type Usage } from "../types";
import { countRequest, pathOf, serviceOf } from "../usage";

const SUPABASE_ORIGIN = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;

// Adds up every finished request by service (the browser's Resource Timing), and records each slow one.
// Returns `takeUsage`: the totals since it was last called, for the screen being left.
export function useResourceUsage() {
  const usage = useRef<Usage>({});

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        const service = serviceOf(entry.name, SUPABASE_ORIGIN, location.origin);
        if (!service) continue;
        countRequest(usage.current, service, entry.duration, entry.transferSize);
        if (entry.duration >= SLOW_REQUEST_MS) record("slow", { target: pathOf(entry.name), ms: entry.duration });
      }
    });
    // `buffered`: the requests made while the app was starting, before this effect ran, count too.
    observer.observe({ type: "resource", buffered: true });
    return () => observer.disconnect();
  }, []);

  return useCallback(() => {
    const taken = usage.current;
    usage.current = {};
    return taken;
  }, []);
}
