"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isSavedCopy } from "@/lib/savedHome";

// Asks the server for the current page as soon as the saved Home is on screen (public/sw.js, HOME), so the
// saved copy shows only while the fresh one is on its way. `renderedAt` is when the server made the page.
export default function RefreshSavedPage({ renderedAt }: { renderedAt: number }) {
  const router = useRouter();

  useEffect(() => {
    if (isSavedCopy(renderedAt)) router.refresh();
  }, [renderedAt, router]);

  return null;
}
