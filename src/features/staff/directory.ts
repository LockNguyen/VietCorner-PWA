import type { StaffMember } from "./types";

// The church's staff, in the order the page shows them. To add someone: one more entry, their photo (a
// square JPEG, about 400 pixels) in public/images/staff.
// TODO(user): Pastor Khai's phone number, his photo, and the spelling of his name in Vietnamese.
export const STAFF: StaffMember[] = [
  {
    role: { en: "Executive pastor", vi: "Mục sư điều hành" },
    name: { en: "Pastor Khai", vi: "Mục sư Khai" },
    phone: null,
    photo: null,
  },
];
