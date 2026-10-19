import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffSection } from "../types";

// Server-side reads for this feature. The page creates the client and passes it in.

// Every heading with the people placed under it, in page order, in one trip (embedded selects follow the
// foreign keys: heading → placements → person).
export async function getStaffSections(supabase: SupabaseClient): Promise<StaffSection[]> {
  const { data, error } = await supabase
    .from("staff_sections")
    .select(
      "id, heading_en, heading_vi, staff_placements (staff_people (id, name_en, name_vi, role_en, role_vi, phone, photo))",
    )
    .order("position")
    .order("position", { referencedTable: "staff_placements" });
  if (error) return []; // also the answer before schema.sql has been run

  return (data as unknown as SectionRow[]).map((section) => ({
    id: section.id,
    heading: { en: section.heading_en, vi: section.heading_vi },
    members: section.staff_placements.map(({ staff_people: person }) => ({
      id: person.id,
      name: { en: person.name_en, vi: person.name_vi },
      role: { en: person.role_en, vi: person.role_vi },
      phone: person.phone,
      photo: person.photo,
    })),
  }));
}

// The rows as Supabase returns them, before the `_en` / `_vi` columns become `Text`.
type SectionRow = {
  id: string;
  heading_en: string;
  heading_vi: string;
  staff_placements: {
    staff_people: {
      id: string;
      name_en: string;
      name_vi: string;
      role_en: string;
      role_vi: string;
      phone: string | null;
      photo: string | null;
    };
  }[];
};
