import type { Text } from "@/features/i18n/types"; // I18N

// Every word this feature shows a user, in both languages. What a group writes about itself is data.
export const STRINGS = {
  noGroups: { en: "There are no groups yet.", vi: "Chưa có nhóm nào." } satisfies Text,

  // The sheet about one group, and its editor
  groupName: { en: "Group name", vi: "Tên nhóm" } satisfies Text,
  memberCountField: { en: "Number of members", vi: "Số thành viên" } satisfies Text,
  when: { en: "When", vi: "Thời gian" } satisfies Text,
  where: { en: "Where", vi: "Địa điểm" } satisfies Text,
  notes: { en: "Notes", vi: "Ghi chú" } satisfies Text,
  contact: { en: "Contact", vi: "Liên lạc" } satisfies Text,
  savePhoto: { en: "Save to phone", vi: "Lưu về máy" } satisfies Text, // the viewer's download button
  couldNotSavePhoto: { en: "Could not save the picture. Please try again.", vi: "Không lưu được hình. Xin thử lại." } satisfies Text,
  pickDay: { en: "Day", vi: "Ngày" } satisfies Text, // the weekday picker before a day is chosen
  time: { en: "Time", vi: "Giờ" } satisfies Text,
  addGroup: { en: "New group", vi: "Nhóm mới" } satisfies Text, // the + on the Groups tab
  nothingYet: { en: "No details yet.", vi: "Chưa có thông tin." } satisfies Text,
  cancel: { en: "Cancel", vi: "Hủy" } satisfies Text,

  // Pictures
  photos: { en: "Photos", vi: "Hình ảnh" } satisfies Text,
  photoOf: { en: "Photo of", vi: "Hình của" } satisfies Text,
  addPhoto: { en: "Add a photo", vi: "Thêm hình" } satisfies Text,
  choosePhoto: { en: "Photo", vi: "Hình" } satisfies Text,
  takenOn: { en: "Date (optional)", vi: "Ngày (không bắt buộc)" } satisfies Text,
  caption: { en: "A few words (optional)", vi: "Vài lời (không bắt buộc)" } satisfies Text,
  sendingPhoto: { en: "Sending…", vi: "Đang gửi…" } satisfies Text,
  photoAdded: { en: "Photo added", vi: "Đã thêm hình" } satisfies Text,
  photoFailed: { en: "Could not add the photo. Please try again.", vi: "Không thêm được hình. Xin thử lại." } satisfies Text,
  removePhoto: { en: "Remove this photo", vi: "Gỡ hình này" } satisfies Text,
  previousPhoto: { en: "Previous photo", vi: "Hình trước" } satisfies Text,
  nextPhoto: { en: "Next photo", vi: "Hình sau" } satisfies Text,
};

// "12 members" under a group's name. A phrase with a number in it, so it is a function.
export function members(count: number): Text {
  return { en: count === 1 ? "1 member" : `${count} members`, vi: `${count} thành viên` };
}
