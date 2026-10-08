import type { Text } from "@/features/i18n/types"; // I18N

// Every word this foundation shows a user, in both languages. Names themselves are data.
export const STRINGS = {
  askName: { en: "What is your name?", vi: "Xin cho biết tên" } satisfies Text,
  whoSeesIt: {
    en: "People in your groups will see it beside what you write.",
    vi: "Những người cùng nhóm sẽ thấy tên này bên cạnh những gì được viết.",
  } satisfies Text,
  nameField: { en: "Name", vi: "Tên" } satisfies Text,
  continue: { en: "Continue", vi: "Tiếp tục" } satisfies Text,
};
