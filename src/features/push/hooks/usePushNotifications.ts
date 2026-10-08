"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "../api";

export type PushStatus = "loading" | "unsupported" | "blocked" | "off" | "on";

// Push notifications for this device: works out the current state, and turns them on when asked.
export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");

  // On every app open, find out where this device stands.
  useEffect(() => {
    // iPhone only offers push inside an app added to the Home Screen.
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setStatus("unsupported");
    if (Notification.permission === "denied") return setStatus("blocked");

    // Already subscribed → save it again. Why: the server can only push to subscriptions stored in the
    // database, and that row may be gone (deleted after a 410, another user signed in on this device) or
    // the browser may have replaced the subscription. Re-saving on every open repairs this silently.
    // `serviceWorker.ready` waits for sw.js, because subscriptions belong to the service worker.
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (subscription) save(subscription);
        else setStatus("off");
      });
  }, []);

  // Must be called from a tap: iOS only shows the permission prompt after a user gesture.
  // Resolves to false only when the subscription could not be saved; "blocked" shows as its own state.
  async function enable(): Promise<boolean> {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("blocked");
      return true;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // browsers require every push to show a notification
      applicationServerKey: base64UrlToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    return save(subscription);
  }

  // A subscription the server does not hold is as good as none, so a failed save leaves the state "off".
  async function save(subscription: PushSubscription): Promise<boolean> {
    try {
      await savePushSubscription(subscription);
      setStatus("on");
      return true;
    } catch {
      setStatus("off");
      return false;
    }
  }

  return { status, enable };
}

// The Push API wants the VAPID public key as bytes. Some browsers (older Safari) reject the text form.
function base64UrlToBytes(base64Url: string) {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}
