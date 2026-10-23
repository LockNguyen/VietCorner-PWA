import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { WORSHIP_FOLDER, WORSHIP_SONGS } from "./types";

// The song list is typed by hand next to the files in public/; this keeps the two from drifting apart.
describe("the worship songs", () => {
  it("are exactly the files in the folder", () => {
    const files = readdirSync(join(process.cwd(), "public", WORSHIP_FOLDER)).filter((file) => file.endsWith(".mp3"));
    const listed = WORSHIP_SONGS.map((path) => path.slice(WORSHIP_FOLDER.length));

    expect([...listed].sort()).toEqual([...files].sort());
  });
});
