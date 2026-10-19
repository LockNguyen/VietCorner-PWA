import type { Text } from "@/features/i18n/types"; // I18N

// One card on the staff page: a row of `staff_people` (schema.sql), placed under a heading. Since 2026-10-19 the list lives in
// Supabase, so the user edits it in the SQL Editor (edit-staff.sql) without a deploy.
export type StaffMember = {
  id: string;
  role: Text; // the grey line under their name: "Executive pastor"
  name: Text; // how members call them, in each language: "Pastor Khai"
  phone: string | null; // as it is written for people: "(336) 555-0101"; null = not given yet, no number shown
  photo: string | null; // a URL or a path under public/; null = the default figure
};

// A heading on the page ("Ban điều hành") and the cards under it, in page order.
export type StaffSection = {
  id: string;
  heading: Text;
  members: StaffMember[];
};
