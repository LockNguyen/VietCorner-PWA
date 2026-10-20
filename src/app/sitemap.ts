import type { MetadataRoute } from "next";
import { CHURCH } from "@/lib/church";

// /sitemap.xml: the one page a visitor who is not signed in can read. `/` sends them here, so it is the page
// listed (a sitemap should name pages, not redirects).
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${CHURCH.site}/login` }];
}
