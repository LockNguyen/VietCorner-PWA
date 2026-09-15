"use client";

import { usePushNotifications } from "../hooks/usePushNotifications";

// Shows this device's notification state, with a button to turn notifications on.
// The logic lives in hooks/usePushNotifications.ts.
export default function EnableNotificationsButton() {
  const { status, enable } = usePushNotifications();

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
