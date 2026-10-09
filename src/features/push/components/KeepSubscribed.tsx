"use client";

import { usePushNotifications } from "../hooks/usePushNotifications";

// On every opening of the app, saves this device's subscription again if it has one: the stored row may be
// gone, or belong to whoever used this phone before (the push README). Rendered once in the root layout;
// it draws nothing. The switch itself is in Settings.
export default function KeepSubscribed() {
  usePushNotifications();
  return null;
}
