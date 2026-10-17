import type { Language } from "./types";

// How this congregation says a time and names Sunday, in either language. Pure, so it is tested without a
// screen. Here, in the language foundation, because any feature that shows a time or a weekday needs it.

// A time of day, from "19:00" or "19:00:00" (a wall clock, already in church time): "7:00 PM" in English,
// "7:00 Tối" in Vietnamese (the user's word, 2026-10-17). Every time the app shows goes through here. A 12-hour
// clock, because that is how the members say it; the word for the part of the day replaces AM/PM.
export function clockTime(wallClock: string, language: Language): string {
  const [hours, minutes] = wallClock.split(":").map(Number);
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const time = `${hour12}:${String(minutes).padStart(2, "0")}`;
  return `${time} ${language === "en" ? (hours < 12 ? "AM" : "PM") : partOfDay(hours)}`;
}

// why these hours: Sáng until 11, Trưa over midday, Chiều in the afternoon, Tối from six in the evening,
// as the words are used in everyday speech.
function partOfDay(hours: number): string {
  if (hours < 11) return "Sáng";
  if (hours < 13) return "Trưa";
  if (hours < 18) return "Chiều";
  return "Tối";
}

// A church says "Chúa Nhật" (the Lord's day) where the phone's calendar says "Chủ Nhật". Applied to any
// Vietnamese text the phone wrote with a weekday in it.
export function withChurchSunday(text: string): string {
  return text.replace(/Chủ nhật/gi, "Chúa Nhật");
}
