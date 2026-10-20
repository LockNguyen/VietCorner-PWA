// Who the app belongs to, for search engines and maps (the user, 2026-10-20: someone searching "Hội Thánh Việt
// Nam ở Winston-Salem" should find vietcorners.org). One place, so the page's description, the structured data
// Google reads and the map links cannot disagree. The app's own name stays Viet Corners (`appName.ts`).
export const CHURCH = {
  // Exactly as on the Google Business Profile: Google ties the website to the listing by matching name and address.
  name: "Hội Thánh Báp-Tít Việt Nam - Winston-Salem",
  nameEn: "Winston-Salem Vietnamese Baptist Church",
  // The words people search with, said plainly on the website's first screen and in its description.
  searchedAs: "Hội Thánh Việt Nam ở Winston-Salem",
  // Change here when the times change: the search description says them, and it is not read from the events.
  serviceTimes: "Trường Chúa Nhật 9:15 sáng, Thờ Phượng 10:30 sáng",
  street: "134 S Peace Haven Rd",
  building: "SeChrist Building",
  city: "Winston-Salem",
  state: "NC",
  zip: "27104",
  phone: "+1-336-997-8012",
  // The entrance of our building (36°04'56.3"N 80°21'03.8"W, given by the user, 2026-10-20). Maps put the street
  // address on the building next door, so Apple Maps and the structured data use this pin instead.
  pin: { lat: 36.082306, lng: -80.351056 },
  // The Google Business Profile's id (cid), from the user's share link (2026-10-20): opens the listing itself.
  googleCid: "9267317380074804884",
  // The address Google should show. The Netlify address serves the same site; the page names this one as canonical.
  site: "https://vietcorners.org",
};
