"use client";

import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useTextSize } from "../hooks/useTextSize";
import { SIZES, STRINGS } from "../strings";

// The text size choice: one row per size, a tick on the current one, like the language choice beside it.
// In Settings, and on the sign-up screen so a new member can make the app readable from the start.
export default function TextSizeChoice() {
  const { t } = useLanguage(); // I18N
  const { size, choose } = useTextSize();

  return (
    <section>
      <SectionHeading>{t(STRINGS.heading)}</SectionHeading>
      <ul>
        {SIZES.map((option) => (
          <ListRow
            key={option.size}
            title={t(option.label)}
            onClick={() => choose(option.size)}
            current={size === option.size}
            trailing={null}
          />
        ))}
      </ul>
    </section>
  );
}
