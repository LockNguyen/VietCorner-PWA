"use client";

import { useRef, useState } from "react";
import { createRequest, deleteRequest, getRequests, markAnswered, prayFor } from "../api";
import { PAGE_SIZE, type NewPrayerRequest, type PrayerRequest } from "../types";

// The list of requests on screen, and everything that changes it.
//
// There are no live updates on purpose: the list is what the server sent when the page opened, plus what
// this member did since. Each action below resolves to `true` when it worked, so a component can clear a
// form or close a dialog only then.
export function usePrayerFeed(initialRequests: PrayerRequest[]) {
  const [requests, setRequests] = useState(initialRequests);
  // A full page means there may be another one; a short page is the end.
  const [hasMore, setHasMore] = useState(initialRequests.length === PAGE_SIZE);
  const [failed, setFailed] = useState(false);
  // A ref, not state: reaching the bottom can fire twice before a re-render, and the second call must see it.
  const loadingOlder = useRef(false);

  async function attempt(action: () => Promise<void>): Promise<boolean> {
    setFailed(false);
    try {
      await action();
      return true;
    } catch {
      setFailed(true);
      return false;
    }
  }

  return {
    requests,
    hasMore,
    failed,

    async loadOlder() {
      const oldest = requests.at(-1);
      if (loadingOlder.current || !hasMore || !oldest) return;

      loadingOlder.current = true;
      await attempt(async () => {
        const page = await getRequests(oldest.created_at);
        setRequests((current) => {
          const onScreen = new Set(current.map((request) => request.id));
          return [...current, ...page.filter((request) => !onScreen.has(request.id))];
        });
        setHasMore(page.length === PAGE_SIZE);
      });
      loadingOlder.current = false;
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

    answer: (requestId: string) =>
      attempt(async () => {
        await markAnswered(requestId);
        const answeredAt = new Date().toISOString();
        setRequests((current) =>
          current.map((request) => (request.id === requestId ? { ...request, answered_at: answeredAt } : request)),
        );
      }),

    remove: (requestId: string) =>
      attempt(async () => {
        await deleteRequest(requestId);
        setRequests((current) => current.filter((request) => request.id !== requestId));
      }),

    pray: (requestId: string) => attempt(() => prayFor(requestId)),
  };
}
