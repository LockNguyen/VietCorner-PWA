"use client";

import { useOnArrival } from "@/lib/useOnArrival";
import { usePending } from "@/lib/usePending";
import { useRefresh } from "@/lib/useRefresh";
import { askToBeLetIn, renewMyToken } from "../api";

// What the waiting screen does by itself, on arrival and on every return to the app: tells the admins
// (the server does that once), then looks whether it has been let in. Looking is a new login token and a
// reload: once the token carries the approval, the layout draws the app instead of the waiting screen.
export function useWaitForApproval() {
  const refresh = useRefresh();
  const { pending, run } = usePending<"check">();

  function check() {
    return run("check", async () => {
      try {
        await renewMyToken();
        await refresh();
      } catch {
        // Offline, or a hiccup: the screen stays, and the next return to the app looks again.
      }
    });
  }

  useOnArrival(() => {
    askToBeLetIn().catch(() => {}); // best-effort: the admin's list shows this account either way
    check();
  });

  return { checking: pending === "check", check };
}
