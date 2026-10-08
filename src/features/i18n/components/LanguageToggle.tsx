"use client";

import { Check } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "../hooks/useLanguage";
import { STRINGS } from "../strings";
import { LANGUAGE_NAMES, type Language } from "../types";

const OPTIONS: Language[] = ["vi", "en"]; // the congregation's language first

// The language choice: one row per language, a tick on the current one. Rows, not a dropdown, to tap.
export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <section>
      <SectionHeading>{t(STRINGS.languageLabel)}</SectionHeading>
      <ul>
        {OPTIONS.map((option) => {
          const chosen = language === option;
          return (
            <ListRow
              key={option}
              title={LANGUAGE_NAMES[option]}
              onClick={() => setLanguage(option)}
              current={chosen}
              trailing={chosen ? <Check aria-hidden className="shrink-0 text-action" /> : null}
            />
          );
        })}
      </ul>
    </section>
  );
}
