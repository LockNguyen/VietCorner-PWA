// A typed phone number as the phone's call and text links need it: digits only, with a leading + kept for
// a number from abroad. "(336) 555-0101" → "3365550101". Pure, so it is tested without a screen.
export function dialable(phone: string): string {
  const trimmed = phone.trim();
  return (trimmed.startsWith("+") ? "+" : "") + trimmed.replace(/\D/g, "");
}
