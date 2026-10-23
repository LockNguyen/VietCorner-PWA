"use client";

import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { RANGE_NAMES, STRINGS } from "../strings";
import { RANGES, type Range } from "../types";

// The period a dashboard screen covers; the chosen one ends in a tick. It lives in the address (`?days=`).
export default function RangePicker({ days, path }: { days: Range; path: string }) {
  const { t } = useLanguage(); // I18N
  return (
    <section>
      <SectionHeading>{t(STRINGS.period)}</SectionHeading>
      <ul>
        {RANGES.map((range) => (
          <ListRow key={range} href={`${path}?days=${range}`} title={t(RANGE_NAMES[range])} current={range === days} />
        ))}
      </ul>
    </section>
  );
}
