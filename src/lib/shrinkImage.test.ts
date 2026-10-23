import { describe, expect, it } from "vitest";
import { shrinkSteps } from "./shrinkImage";

describe("the sizes and qualities a picture is tried at", () => {
  it("tries every quality at full size first, best first", () => {
    expect(shrinkSteps(2560).slice(0, 4)).toEqual([
      { side: 2560, quality: 0.92 },
      { side: 2560, quality: 0.85 },
      { side: 2560, quality: 0.75 },
      { side: 2560, quality: 0.65 },
    ]);
  });

  it("then a fifth smaller each time, never below 400 pixels", () => {
    const sides = [...new Set(shrinkSteps(2560).map((step) => step.side))];
    expect(sides).toEqual([2560, 2048, 1638, 1310, 1048, 838, 670, 536, 429]);
  });

  it("still tries the full size once for a picture already small", () => {
    expect(shrinkSteps(400)).toHaveLength(4);
  });
});
