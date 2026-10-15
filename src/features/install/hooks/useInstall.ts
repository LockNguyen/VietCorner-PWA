"use client";

import { useEffect, useState } from "react";
import { deviceOf, type Device } from "../device";

// Chrome's own install dialog, held until the person taps our button. Not in TypeScript's DOM types yet.
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// why: a computer (an admin) may use the site in a tab; remembered so the guide is not shown every visit.
const BROWSER_KEY = "vietcorner.use-in-browser";

// Where this visit stands on installing the app, and Chrome's one-tap install where it offers one.
export function useInstall() {
  const [device, setDevice] = useState<Device | null>(null); // null until read on the phone itself
  const [inBrowser, setInBrowser] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false); // installed from this tab, which stays a tab

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true; // the iPhone's own flag
    setDevice(deviceOf(navigator.userAgent, standalone, navigator.maxTouchPoints));
    setInBrowser(readFlag());

    // Chrome offers to install by raising this event; holding it lets our button open the dialog later.
    const keepPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const markInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", keepPrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", keepPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  // Must run from a tap: Chrome opens its dialog only then. A prompt can be used once.
  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    if ((await prompt.userChoice).outcome === "accepted") setInstalled(true);
    setPrompt(null);
  }

  function continueInBrowser() {
    try {
      window.localStorage.setItem(BROWSER_KEY, "yes");
    } catch {
      // Blocked storage: the guide simply returns on the next visit.
    }
    setInBrowser(true);
  }

  return {
    device,
    showGuide: device !== null && device !== "installed" && !inBrowser,
    canInstall: prompt !== null,
    installed,
    install,
    continueInBrowser,
  };
}

function readFlag(): boolean {
  try {
    return window.localStorage.getItem(BROWSER_KEY) === "yes";
  } catch {
    return false;
  }
}
