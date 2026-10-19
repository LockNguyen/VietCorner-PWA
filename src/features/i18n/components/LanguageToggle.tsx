"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "../hooks/useLanguage";
import { LANGUAGE_NAMES, type Language } from "../types";

const OPTIONS: Language[] = ["vi", "en"]; // the congregation's language first

// The language choice, its own screen in Settings: one row per language, a tick on the current one.
// Rows, not a dropdown, to tap.
export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <section>
      <ul>
        {OPTIONS.map((option) => (
          <ListRow
            key={option}
            title={LANGUAGE_NAMES[option]}
            onClick={() => setLanguage(option)}
            current={language === option}
            trailing={null}
          />
        ))}
      </ul>
    </section>
  );
}
