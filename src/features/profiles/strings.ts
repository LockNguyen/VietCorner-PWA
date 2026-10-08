import type { Text } from "@/features/i18n/types"; // I18N

// Every word this foundation shows a user, in both languages. Names themselves are data.
export const STRINGS = {
  askName: { en: "What is your name?", vi: "Xin cho biết tên" } satisfies Text,
  whoSeesIt: {
    en: "Others in the church will see it beside what you write.",
    vi: "Mọi người trong hội thánh sẽ thấy tên này bên cạnh những gì được viết.",
  } satisfies Text,
  nameField: { en: "Name", vi: "Tên" } satisfies Text,
  continue: { en: "Continue", vi: "Tiếp tục" } satisfies Text,
  save: { en: "Save", vi: "Lưu" } satisfies Text,
  saving: { en: "Saving…", vi: "Đang lưu…" } satisfies Text,
  saved: { en: "Saved", vi: "Đã lưu" } satisfies Text,
  couldNotSave: { en: "Could not save. Please try again.", vi: "Không lưu được. Xin thử lại." } satisfies Text,
};
