import { createClient } from "@/lib/supabase/client";
import { getStaffSections as readStaffSections } from "./reads";
import type { StaffSection } from "./types";

// Staff API: every call the browser makes for this feature. Members only read.

// GET the staff page's headings and people again, as the page first read them, for the list to refresh itself
// on arrival (`useFresh`).
export function getStaffSections(): Promise<StaffSection[]> {
  return readStaffSections(createClient());
}
