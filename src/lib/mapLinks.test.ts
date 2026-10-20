import { describe, expect, it } from "vitest";
import { CHURCH } from "./church";
import { mapLinks } from "./mapLinks";

describe("where the map buttons lead", () => {
  it("is the church's own listing and pin for its address, however it is written", () => {
    for (const address of ["134 S Peace Haven Rd (SeChrist Building)", " 134 s peace haven rd winston-salem nc 27104"]) {
      expect(mapLinks(address).google).toBe(`https://maps.google.com/?cid=${CHURCH.googleCid}`);
      expect(mapLinks(address).apple).toContain(`ll=${CHURCH.pin.lat},${CHURCH.pin.lng}`);
    }
  });

  it("is a search for any other address, including a longer number on the same street", () => {
    expect(mapLinks("1134 S Peace Haven Rd").google).toBe(
      "https://www.google.com/maps/search/?api=1&query=1134%20S%20Peace%20Haven%20Rd",
    );
    expect(mapLinks("164 Whitfield Dr, Dallas, TX").apple).toBe("https://maps.apple.com/?q=164%20Whitfield%20Dr%2C%20Dallas%2C%20TX");
  });
});
