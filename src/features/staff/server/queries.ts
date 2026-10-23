// Server-side reads for this feature: the page creates the client and passes it in. The reads themselves live in
// reads.ts, shared with the browser's refresh (api.ts), so the two can never read differently.
export { getStaffSections } from "../reads";
