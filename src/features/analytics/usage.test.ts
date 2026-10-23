import { describe, expect, it } from "vitest";
import type { Usage } from "./types";
import { countRequest, pathOf, serviceOf } from "./usage";

const SUPABASE = "https://abc.supabase.co";
const APP = "https://vietcorners.netlify.app";

describe("serviceOf", () => {
  it("names each Supabase service by the first part of the path", () => {
    expect(serviceOf(`${SUPABASE}/rest/v1/events?select=*`, SUPABASE, APP)).toBe("database");
    expect(serviceOf(`${SUPABASE}/storage/v1/object/sign/photos/a.jpg`, SUPABASE, APP)).toBe("storage");
    expect(serviceOf(`${SUPABASE}/auth/v1/token`, SUPABASE, APP)).toBe("auth");
    expect(serviceOf(`${SUPABASE}/functions/v1/hello`, SUPABASE, APP)).toBe("functions");
    expect(serviceOf(`${SUPABASE}/realtime/v1/websocket`, SUPABASE, APP)).toBeNull();
  });

  it("tells the app's routes from its files, and leaves out the tracker's own route", () => {
    expect(serviceOf(`${APP}/api/prayer/pray`, SUPABASE, APP)).toBe("api");
    expect(serviceOf(`${APP}/_next/static/chunks/a.js`, SUPABASE, APP)).toBe("files");
    expect(serviceOf(`${APP}/api/analytics/record`, SUPABASE, APP)).toBeNull();
  });

  it("ignores other sites", () => {
    expect(serviceOf("https://maps.google.com/x", SUPABASE, APP)).toBeNull();
  });
});

describe("pathOf", () => {
  it("drops the query, which can carry ids and signed tokens", () => {
    expect(pathOf(`${SUPABASE}/storage/v1/object/sign/a.jpg?token=secret`)).toBe("/storage/v1/object/sign/a.jpg");
  });
});

describe("countRequest", () => {
  it("adds up requests, whole milliseconds and bytes per service", () => {
    const usage: Usage = {};
    countRequest(usage, "database", 120.4, 1000);
    countRequest(usage, "database", 80.2, 500);
    countRequest(usage, "storage", 300, 0);
    expect(usage).toEqual({
      database: { requests: 2, ms: 200, bytes: 1500 },
      storage: { requests: 1, ms: 300, bytes: 0 },
    });
  });
});
