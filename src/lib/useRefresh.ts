"use client";

import { useRouter } from "next/navigation";
import { useWhenDrawn } from "./useWhenDrawn";

// Reloads the page's server data, and resolves when the new data is on screen (see `useWhenDrawn`).
//
//   const refresh = useRefresh();
//   await save();
//   await refresh();   // the button stays busy until the reloaded list has been drawn
export function useRefresh() {
  const router = useRouter();
  const whenDrawn = useWhenDrawn();

  return () => whenDrawn(() => router.refresh());
}
