// Reading answers aloud with the browser's own voice: free, offline, no quota.
//
// Three things make this harder than it looks:
//  1. iPhones refuse to speak unless speech was already used during a tap. Our answer arrives seconds
//     after that tap, so we "prime" the engine while the tap is still happening.
//  2. A voice must match the language, or Vietnamese is read with an English accent and elderly listeners
//     lose the thread. We pick the language from the text itself.
//  3. Answers carry citations like [1][2]. On screen they match the source list; read aloud they become
//     "mở ngoặc vuông một", so the spoken copy is stripped while the displayed text keeps them.

// Vietnamese-only letters and tone marks. English text never contains these.
const VIETNAMESE_LETTERS = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;

// "[1]", "[2][3]" and any spaces left behind.
const CITATIONS = /\s*\[\d+\]/g;

export function stripCitations(text: string): string {
  return text.replace(CITATIONS, "").replace(/\s{2,}/g, " ").trim();
}

export function isSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Call this inside a tap handler, before any awaiting. Without it, iOS stays silent.
export function prime(): void {
  if (isSupported()) window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
}

// Read `text` aloud, without its citations.
export function speak(text: string): void {
  if (!isSupported()) return;

  const utterance = new SpeechSynthesisUtterance(stripCitations(text));
  utterance.lang = VIETNAMESE_LETTERS.test(text) ? "vi-VN" : "en-US";
  utterance.rate = 0.9; // why: slower than default, for elderly listeners

  window.speechSynthesis.cancel(); // drop whatever is still being read
  window.speechSynthesis.speak(utterance);
}

export function stop(): void {
  if (isSupported()) window.speechSynthesis.cancel();
}
