"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFreshReport } from "../hooks/useFreshReport";
import { getOverview } from "../reads";
import { duration, STRINGS } from "../strings";
import type { Overview, Range } from "../types";
import StatSection from "./StatSection";

// The period's totals, one per row.
export default function OverviewList({ overview: loaded, days }: { overview: Overview | null; days: Range }) {
  const overview = useFreshReport(loaded, getOverview, days); // kept copy at once, then a fresh read on arrival
  const { t } = useLanguage(); // I18N
  return (
    <StatSection heading={t(STRINGS.totals)} empty={!overview || overview.visits === 0}>
      {overview && (
        <>
          <ListRow title={t(STRINGS.people)} value={String(overview.people)} />
          <ListRow title={t(STRINGS.visits)} value={String(overview.visits)} />
          <ListRow title={t(STRINGS.views)} value={String(overview.views)} />
          <ListRow title={t(STRINGS.timeSpent)} value={t(duration(overview.total_ms))} />
          <ListRow title={t(STRINGS.errors)} value={String(overview.errors)} />
          <ListRow title={t(STRINGS.slow)} value={String(overview.slow)} />
        </>
      )}
    </StatSection>
  );
}
