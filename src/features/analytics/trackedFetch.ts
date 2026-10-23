import { record } from "./queue";
import { pathOf } from "./usage";

// The fetch of the browser's Supabase client (lib/supabase/client.ts, its documented `global.fetch` option):
// the same request, plus a note of each one that failed, with its status. The browser's own timing data
// cannot say whether a request failed on an iPhone; this can.
export async function trackedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  try {
    const response = await fetch(input, init);
    if (!response.ok) {
      record("error", {
        target: `${response.status} ${pathOf(url)}`,
        detail: { source: "supabase", status: response.status },
      });
    }
    return response;
  } catch (error) {
    // A request the app cancelled on purpose is not a failure.
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      record("error", { target: `no answer ${pathOf(url)}`, detail: { source: "supabase", status: 0 } });
    }
    throw error;
  }
}
