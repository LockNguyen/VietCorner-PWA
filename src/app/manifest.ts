import type { MetadataRoute } from "next";

// Next.js serves this at /manifest.webmanifest. It makes the site installable as an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Góc Việt · VietCorners",
    short_name: "Góc Việt", // what sits under the icon: about twelve characters fit
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1976d2",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
