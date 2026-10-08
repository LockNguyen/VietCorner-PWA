"use client";

import { useRef, useState } from "react";
import { createRequest, deleteRequest, editRequest, getRequests, markAnswered, prayFor } from "../api";
import { PAGE_SIZE, type NewPrayerRequest, type PrayerRequest } from "../types";

// The list of requests on screen, and everything that changes it. No live updates, on purpose.
// Each action resolves to whether it worked; saying so on screen is the board's job.
export function usePrayerFeed(initialRequests: PrayerRequest[]) {
  const [requests, setRequests] = useState(initialRequests);
  // A full page means there may be another one; a short page is the end.
  const [hasMore, setHasMore] = useState(initialRequests.length === PAGE_SIZE);
  // A ref, not state: reaching the bottom can fire twice before a re-render, and the second call must see it.
  const loadingOlder = useRef(false);

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

    // The new request is read back rather than built here: its author line and group name are the view's
    // to decide. Starting again from the newest page also picks up what others posted meanwhile.
    post: (request: NewPrayerRequest) =>
      attempt(async () => {
        await createRequest(request);
        const newest = await getRequests();
        setRequests(newest);
        setHasMore(newest.length === PAGE_SIZE);
      }),

    edit: (requestId: string, body: string) =>
      attempt(async () => {
        await editRequest(requestId, body);
        setRequests((current) =>
          current.map((request) => (request.id === requestId ? { ...request, body } : request)),
        );
      }),

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

    pray: (requestId: string) => attempt(() => prayFor(requestId)),
  };
}
