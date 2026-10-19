import type { Text } from "@/features/i18n/types"; // I18N

// One person on the staff page. A fixed list in `directory.ts` (the user, 2026-10-19): staff change a few
// times a decade, so editing a line of code beats a table, its rules and an editor screen.
export type StaffMember = {
  role: Text; // the heading above their card: "Executive pastor"
  name: Text; // how members call them, in each language: "Pastor Khai"
  phone: string | null; // as it is written for people: "(336) 555-0101"; null = not given yet, no number shown
  photo: string | null; // a file in public/images/staff; null = the default figure
};
