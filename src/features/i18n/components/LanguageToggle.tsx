"use client";

import { Check } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "../hooks/useLanguage";
import { STRINGS } from "../strings";
import type { Language } from "../types";

// Each option is written in its own language, so it is readable to the person who needs it.
const OPTIONS: { value: Language; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

// The language choice: one row per language, a tick on the current one. Rows, not a dropdown, to tap.
export default function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <section>
      <SectionHeading>{t(STRINGS.languageLabel)}</SectionHeading>
      <ul>
        {OPTIONS.map((option) => {
          const chosen = language === option.value;
          return (
            <ListRow
              key={option.value}
              title={option.label}
              onClick={() => setLanguage(option.value)}
              current={chosen}
              trailing={chosen ? <Check aria-hidden className="shrink-0 text-action" /> : null}
            />
          );
        })}
      </ul>
    </section>
  );
}
