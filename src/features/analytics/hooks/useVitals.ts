"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { record } from "../queue";

// web-vitals cannot stop listening, and React runs an effect twice in development: listen once per page load.
let listening = false;

// Records Google's page experience measures, each rated good / needs improvement / poor by the library:
// LCP (main content drawn), INP (a tap's answer), CLS (things jumping, × 1000 to fit whole numbers),
// TTFB (the server's first byte: its own Supabase reads included).
export function useVitals() {
  useEffect(() => {
    if (listening) return;
    listening = true;
    const report = (metric: Metric) =>
      record("vital", {
        target: metric.name,
        ms: metric.name === "CLS" ? metric.value * 1000 : metric.value,
        detail: { rating: metric.rating },
      });
    onLCP(report);
    onINP(report);
    onCLS(report);
    onTTFB(report);
  }, []);
}
