"use client";

import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useTextSize } from "../hooks/useTextSize";
import { SIZES, STRINGS } from "../strings";

// The text size choice: one row per size, a tick on the current one, like the language choice beside it.
// In Settings under a small heading; as sign-up's first step (`asStep`) under a big bold title, like the
// other setup screens' ("Check your email").
export default function TextSizeChoice({ asStep = false }: { asStep?: boolean }) {
  const { t } = useLanguage(); // I18N
  const { size, choose } = useTextSize();

  return (
    <section>
      {asStep ? (
        <div className="pb-2 text-center">
          <Text as="h1" variant="tile">{t(STRINGS.stepTitle)}</Text>
        </div>
      ) : (
        <SectionHeading>{t(STRINGS.heading)}</SectionHeading>
      )}
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
