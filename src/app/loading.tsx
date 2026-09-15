// Shown instantly while any page renders on the server.
// Why: dynamic pages (they read cookies) aren't prefetched, so without this a tap shows nothing until the server responds.
export default function Loading() {
  return <p className="p-4 text-lg text-gray-500">Loading…</p>;
}
