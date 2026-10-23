"use client";

import { useEffect, useRef, useState } from "react";
import { useOnArrival } from "@/lib/useOnArrival";
import { deleteRequest, getRequests, markAnswered, prayFor } from "../api";
import { withNewest } from "../feed";
import { PAGE_SIZE, type PrayerRequest } from "../types";

// The list as it was last shown. It outlives leaving the tab, so coming back starts from it and not from
// the page's kept, older copy (src/lib/README.md); a full page load (signing out) empties it.
let lastShown: PrayerRequest[] | undefined;

// The list of requests on screen, and every change made from it (writing one has its own screen). Each action resolves to whether it
// worked; saying so is the board's job. Refreshed on arrival, not live (the prayer README).
export function usePrayerFeed(initialRequests: PrayerRequest[]) {
  const [requests, setRequests] = useState(lastShown ?? initialRequests);
  useEffect(() => {
    lastShown = requests;
  }, [requests]);
  // A full page means there may be another one; a short page is the end.
  const [hasMore, setHasMore] = useState(initialRequests.length === PAGE_SIZE);
  // A ref, not state: reaching the bottom can fire twice before a re-render, and the second call must see it.
  const loadingOlder = useRef(false);

  useOnArrival(() => {
    getRequests()
      .then((newest) => {
        setRequests((current) => withNewest(current, newest));
        if (newest.length < PAGE_SIZE) setHasMore(false); // a short page is the whole list
      })
      .catch(() => {}); // offline or a hiccup: what is on screen stays, and the next arrival tries again
  });

  function takeOffScreen(requestId: string) {
    setRequests((current) => current.filter((request) => request.id !== requestId));
  }

  async function attempt(action: () => Promise<void>): Promise<boolean> {
    try {
      await action();
      return true;
    } catch {
      return false;
    }
  }

  return {
    requests,
    hasMore,

    async loadOlder(): Promise<boolean> {
      const oldest = requests.at(-1);
      if (loadingOlder.current || !hasMore || !oldest) return true; // nothing to do is not a failure

      loadingOlder.current = true;
      const loaded = await attempt(async () => {
        const page = await getRequests(oldest.created_at);
        setRequests((current) => {
          const onScreen = new Set(current.map((request) => request.id));
          return [...current, ...page.filter((request) => !onScreen.has(request.id))];
        });
        setHasMore(page.length === PAGE_SIZE);
      });
      loadingOlder.current = false;
      return loaded;
    },

    // An answered request leaves the list for everyone. It stays in the database (schema.sql).
    answer: (requestId: string) =>
      attempt(async () => {
        await markAnswered(requestId);
        takeOffScreen(requestId);
      }),

    remove: (requestId: string) =>
      attempt(async () => {
        await deleteRequest(requestId);
        takeOffScreen(requestId);
      }),

    // The new count shows at once; the next read of the list brings everyone else's prayers too.
    pray: (requestId: string) =>
      attempt(async () => {
        await prayFor(requestId);
        setRequests((current) =>
          current.map((request) => (request.id === requestId ? { ...request, prayer_count: request.prayer_count + 1 } : request)),
        );
      }),
  };
}
