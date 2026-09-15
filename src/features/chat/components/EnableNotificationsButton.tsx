"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "loading" | "off" | "on" | "blocked" | "unsupported" | "error";

// Subscribes this device to push notifications and saves the subscription in Supabase.
export default function EnableNotificationsButton() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    // iPhone only offers push inside an app added to the Home Screen.
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setStatus("unsupported");
    if (Notification.permission === "denied") return setStatus("blocked");

    // Runs every time the app opens. Asks the browser: "does this device already have a push subscription?"
    // - Yes → save it to the database again (upsert, so no duplicates) and show "on".
    //   Why re-save: our server can only push to subscriptions stored in the database. The row may be
    //   missing (deleted after a 410, a different user signed in, the DB was reset) or the browser may have
    //   silently replaced the subscription. Re-saving on each open repairs this without the user noticing.
    // - No → show the "Turn on notifications" button. We can't subscribe automatically:
    //   the permission prompt must come from a tap.
    // `serviceWorker.ready` waits until sw.js is active, because subscriptions belong to the service worker.
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => (subscription ? save(subscription) : setStatus("off")));
  }, []);

  // Must run from a tap: iOS only shows the permission prompt after a user gesture.
  async function enable() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setStatus("blocked");

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // browsers require every push to show a notification
      applicationServerKey: base64UrlToBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    await save(subscription);
  }

  // Simple write with no side effects, so it goes straight to Supabase. RLS ties the row to this user.
  async function save(subscription: PushSubscription) {
    const { error } = await createClient()
      .from("push_subscriptions")
      .upsert({ endpoint: subscription.endpoint, subscription: subscription.toJSON() });
    setStatus(error ? "error" : "on");
  }

  const box = "m-4 rounded border p-3";
  if (status === "loading") return null;
  if (status === "on") return <p className={box}>🔔 Notifications are on for this device.</p>;
  if (status === "blocked") return <p className={box}>Notifications are blocked. Turn them on in your phone settings.</p>;
  if (status === "unsupported")
    return <p className={box}>To get notifications, add this app to your Home Screen (Share → Add to Home Screen) and open it from there.</p>;

  return (
    <div className={box}>
      <button onClick={enable} className="w-full rounded bg-blue-500 p-3 text-lg text-white">
        Turn on notifications
      </button>
      {status === "error" && <p className="mt-2 text-red-600">Could not save. Please try again.</p>}
    </div>
  );
}

// The Push API wants the VAPID public key as bytes. Some browsers (older Safari) reject the text form.
function base64UrlToBytes(base64Url: string) {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}
