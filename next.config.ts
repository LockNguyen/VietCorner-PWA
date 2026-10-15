import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only: lets a phone use the dev server through this PC's Tailscale address. Without it,
  // `next dev` refuses its own CSS and JavaScript to any address but localhost, and a page opened through
  // the tunnel arrives bare and does nothing when tapped. Production (Netlify) never reads this.
  allowedDevOrigins: ["*.tail714ada.ts.net"],
  experimental: {
    // Keep a visited page in the phone's memory for ten minutes, so going back to a tab shows it at once
    // instead of asking the server again (by default a page is kept for 0 seconds). The lists refresh
    // themselves behind the kept copy (`useFresh`), and any save reloads everything.
    // why ten minutes: longer than a visit to the app, and the most that the parts which do not refresh
    // themselves (Settings; Admin's events, reminders and group names) can be out of date. Who is waiting
    // to join or to be renamed DOES refresh itself. Sign-out is a full page load, which empties this memory.
    //
    // `static`: how long the grey placeholder fetched ahead for each tab is kept (5 minutes by default).
    // It never changes, so a day: in practice once per opening of the app. Any save still empties this
    // memory, and the placeholders are then fetched once more.
    staleTimes: { dynamic: 600, static: 86_400 },
  },
};

export default nextConfig;
