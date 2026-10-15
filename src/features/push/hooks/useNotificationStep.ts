"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NOTIFICATIONS_ASKED_COOKIE } from "../types";
import { usePushNotifications } from "./usePushNotifications";

// why: the longest a browser keeps a cookie (Chrome's cap is 400 days).
const ASKED_FOR_SECONDS = 400 * 24 * 60 * 60;

// The setup question "turn on notifications?": asked until they are on or the person says "not now".
// Either answer is remembered on the device and the page reloads its data, so the layout moves on.
export function useNotificationStep() {
  const { status, enable } = usePushNotifications();
  const router = useRouter();

  // Nothing to ask when they are already on (an earlier install) or this browser cannot receive any.
  useEffect(() => {
    if (status !== "on" && status !== "unsupported") return;
    rememberAnswered();
    router.refresh();
  }, [status, router]);

  function decline() {
    rememberAnswered();
    router.refresh();
  }

  return { status, enable, decline };
}

function rememberAnswered() {
  document.cookie = `${NOTIFICATIONS_ASKED_COOKIE}=yes; max-age=${ASKED_FOR_SECONDS}; path=/; samesite=lax`;
}
