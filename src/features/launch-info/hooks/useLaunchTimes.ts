"use client";

import { useEffect, useState } from "react";
import { isSavedCopy } from "@/lib/savedHome";
import { launchTimes, type LaunchTimes } from "../launchTimes";

// Taken the first time Home appears after a page load, and kept until the next one: going back to Home
// later in the same visit is not a launch.
let firstHome: { tappable: number; savedHome: boolean } | null = null;

// This launch's numbers, read when the panel opens, so pictures still loading have had time to finish.
// `renderedAt`: when the server made the page, to tell the saved Home from a fresh one.
export function useLaunchTimes(renderedAt: number) {
  const [times, setTimes] = useState<LaunchTimes | null>(null);

  useEffect(() => {
    firstHome ??= { tappable: performance.now(), savedHome: isSavedCopy(renderedAt) };
  }, [renderedAt]);

  function show() {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!navigation || !firstHome) return;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    setTimes(launchTimes(navigation, resources, firstHome.tappable, firstHome.savedHome));
  }

  return { times, show, hide: () => setTimes(null) };
}
