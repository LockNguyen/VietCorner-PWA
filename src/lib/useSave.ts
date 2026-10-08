"use client";

import { useBanner } from "./useBanner";
import { usePending } from "./usePending";
import { useRefresh } from "./useRefresh";

// One change, from tap to result: ignores a second tap, reloads the page's data, says how it went in a banner.
export function useSave<Action extends string>() {
  const { pending, run } = usePending<Action>();
  const refresh = useRefresh();
  const showBanner = useBanner();

  // Resolves to whether the change happened, so a form can clear itself only then.
  function save(action: Action, change: () => Promise<unknown>, says: { done: string; failed: string }) {
    return run(action, async () => {
      try {
        await change();
        await refresh();
        showBanner({ kind: "success", message: says.done });
        return true;
      } catch {
        showBanner({ kind: "error", message: says.failed });
        return false;
      }
    });
  }

  return { pending, save };
}
