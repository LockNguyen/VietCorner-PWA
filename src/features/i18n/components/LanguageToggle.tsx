"use client";

import { useLanguage } from "../hooks/useLanguage";
import { STRINGS } from "../strings";
import type { Language } from "../types";

// Two big buttons, not a dropdown: elderly users tap more reliably than they scroll a select.
// Each option is written in its own language, so it is readable to the person who needs it.
const OPTIONS: { value: Language; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <section className="space-y-2 p-4">
      <p className="text-lg">{t(STRINGS.languageLabel)}</p>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setLanguage(option.value)}
            aria-pressed={language === option.value}
            className={`flex-1 rounded border p-3 text-lg ${
              language === option.value ? "bg-blue-500 text-white" : "bg-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
