import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Keep a visited page in the phone's memory for ten minutes, so going back to a tab shows it at once
    // instead of asking the server again (by default a page is kept for 0 seconds). The lists refresh
    // themselves behind the kept copy (`useFresh`), and any save reloads everything.
    // why ten minutes: longer than a visit to the app, and the most that Settings and Admin, which do not
    // refresh themselves, can be out of date. Sign-out is a full page load, which empties this memory.
    staleTimes: { dynamic: 600 },
  },
};

export default nextConfig;
