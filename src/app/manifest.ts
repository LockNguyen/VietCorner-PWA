import type { MetadataRoute } from "next";

// Next.js serves this at /manifest.webmanifest. It makes the site installable as an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VietCorner",
    short_name: "VietCorner",
    start_url: "/groups",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2196f3",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
