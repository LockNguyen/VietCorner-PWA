"use client";

import { useEffect } from "react";

// Registers public/sw.js. Needed to install the app and (from Step 2) to receive push notifications.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return null;
}
