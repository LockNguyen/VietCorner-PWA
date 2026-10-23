// A typed phone number as the phone's call and text links need it: digits only, with a leading + kept for
// a number from abroad. "(336) 555-0101" → "3365550101". Pure, so it is tested without a screen.
export function dialable(phone: string): string {
  const trimmed = phone.trim();
  return (trimmed.startsWith("+") ? "+" : "") + trimmed.replace(/\D/g, "");
}

// A phone number as it is being typed, in the US shape the church writes them: "(336) 123-4567" (the user,
// 2026-10-23). Digits only, at most ten; the brackets, space and dash appear as the digits arrive. Fewer than four
// digits stay bare, so deleting back past the bracket works as expected. Pure, so it is tested without a screen.
// why the leading 1 goes: it is the US country code ("+1 (336) …", copied from a contact), and no US area code
// starts with 1, so it is never the first digit of the number itself.
export function formatPhone(typed: string): string {
  const digits = typed.replace(/\D/g, "").replace(/^1/, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
