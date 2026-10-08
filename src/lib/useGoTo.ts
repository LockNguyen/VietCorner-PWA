"use client";

import { useRouter } from "next/navigation";
import { useWhenDrawn } from "./useWhenDrawn";

// Moves to another screen, and keeps whoever awaits it busy until that screen is drawn (see `useWhenDrawn`).
// For a save that ends by leaving: without the wait, Save could be tapped again while the app is on its way.
export function useGoTo() {
  const router = useRouter();
  const whenDrawn = useWhenDrawn();

  return (href: string) => whenDrawn(() => router.push(href));
}
