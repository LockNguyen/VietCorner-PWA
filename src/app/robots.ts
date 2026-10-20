import type { MetadataRoute } from "next";
import { CHURCH } from "@/lib/church";

// /robots.txt: search engines may read the public pages; the API is of no use to them.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${CHURCH.site}/sitemap.xml`,
  };
}
