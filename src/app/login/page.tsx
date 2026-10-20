import type { Metadata } from "next";
import Welcome from "@/features/auth/components/Welcome";
import InstallGate from "@/features/install/components/InstallGate"; // INSTALL
import TextSizeChoice from "@/features/text-size/components/TextSizeChoice"; // TEXT-SIZE
import { APP_NAME } from "@/lib/appName";
import { CHURCH } from "@/lib/church";

// The one page anyone not signed in can read (`/` sends them here), so it is what search engines show. The
// brand comes first, Viet Corners, then the words people search with; `canonical` names vietcorners.org, so
// Google prefers it over the Netlify address that serves the same page (the user, 2026-10-20).
export const metadata: Metadata = {
  title: `${APP_NAME} · ${CHURCH.searchedAs}`,
  description:
    `${APP_NAME}: ${CHURCH.name} (${CHURCH.nameEn}). ${CHURCH.serviceTimes}, ` +
    `${CHURCH.street} (${CHURCH.building}), ${CHURCH.city}, ${CHURCH.state} ${CHURCH.zip}.`,
  alternates: { canonical: `${CHURCH.site}/login` },
};

// What Google reads about the church itself: its names, address, phone, website and listing (schema.org).
// `<` becomes its JSON escape, as the Next.js JSON-LD guide advises, so no text can close the script tag.
const CHURCH_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Church",
  name: CHURCH.name,
  alternateName: [CHURCH.nameEn, CHURCH.searchedAs],
  url: CHURCH.site,
  sameAs: [`https://maps.google.com/?cid=${CHURCH.googleCid}`], // the Google Business Profile
  telephone: CHURCH.phone,
  geo: { "@type": "GeoCoordinates", latitude: CHURCH.pin.lat, longitude: CHURCH.pin.lng }, // our building, not the address's
  address: {
    "@type": "PostalAddress",
    streetAddress: CHURCH.street,
    addressLocality: CHURCH.city,
    addressRegion: CHURCH.state,
    postalCode: CHURCH.zip,
    addressCountry: "US",
  },
}).replace(/</g, "\\u003c");

// Every signed-out visit lands here. In the installed app: the email, then the link in the mailbox (the auth
// README). On the website (INSTALL): the language, then how to install; on a phone that is all, and signing
// in happens in the app. A new member's first step in the app is choosing the text size.
export default function LoginPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: CHURCH_DATA }} />
      <InstallGate askLanguage>
        <Welcome firstStep={<TextSizeChoice asStep />} /> {/* TEXT-SIZE */}
      </InstallGate>
    </>
  );
}
