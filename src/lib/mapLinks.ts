import { CHURCH } from "./church";

export type MapLinks = { google: string; apple: string };

// Where the Google Maps and Apple Maps buttons under an address lead. Any address is searched as typed, except
// the church's own: its street number points maps to the building next door, so Google opens the church's
// listing and Apple its pin, labelled with its name (the user, 2026-10-20).
export function mapLinks(address: string): MapLinks {
  if (isChurchAddress(address)) {
    return {
      google: `https://maps.google.com/?cid=${CHURCH.googleCid}`,
      apple: `https://maps.apple.com/?ll=${CHURCH.pin.lat},${CHURCH.pin.lng}&q=${encodeURIComponent(CHURCH.name)}`,
    };
  }
  const query = encodeURIComponent(address);
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${query}`,
    apple: `https://maps.apple.com/?q=${query}`,
  };
}

// An admin types the address freely ("134 S Peace Haven Rd (SeChrist Building)", any case), so the street is
// looked for at the start of it: "1134 S Peace Haven Rd" is another building.
function isChurchAddress(address: string): boolean {
  return address.trim().toLowerCase().startsWith(CHURCH.street.toLowerCase());
}
