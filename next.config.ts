import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only: lets a phone use the dev server through this PC's Tailscale address. Without it,
  // `next dev` refuses its own CSS and JavaScript to any address but localhost, and a page opened through
  // the tunnel arrives bare and does nothing when tapped. Production (Netlify) never reads this.
  allowedDevOrigins: ["*.tail714ada.ts.net"],
  experimental: {
    // Keep a visited page in the phone's memory for an hour, so going back to a screen shows it at once instead
    // of asking the server again (by default a page is kept for 0 seconds). Every screen whose content other people
    // change refreshes itself behind the kept copy (`useFresh` and its uses, `RefreshOnArrival` in the editors), and
    // any save reloads everything; Home and Settings show fixed content or the person's own. So an hour is safe.
    // why an hour (the user, 2026-10-22; it was ten minutes while some screens did not refresh themselves): fewer
    // reloads of the tabs kept ahead (`useLoadAhead`), fewer waits on the network. Sign-out is a full page load,
    // which empties this memory.
    //
    // `static`: how long a tab loaded ahead (`useLoadAhead`, whole page and data) is kept; it is loaded again after.
    staleTimes: { dynamic: 3600, static: 3600 },
  },
};

export default nextConfig;
