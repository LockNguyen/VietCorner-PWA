"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFreshReport } from "../hooks/useFreshReport";
import { getPageStats } from "../reads";
import { pageSummary, STRINGS } from "../strings";
import type { PageStats, Range } from "../types";
import StatSection from "./StatSection";

// Each screen, most opened first: opens, people, time per open, how long it took to appear, errors on it.
export default function PageStatsList({ rows: loaded, days }: { rows: PageStats[]; days: Range }) {
  const rows = useFreshReport(loaded, getPageStats, days); // kept copy at once, then a fresh read on arrival
  const { t } = useLanguage(); // I18N
  return (
    <StatSection heading={t(STRINGS.pagesView)} empty={rows.length === 0}>
      {rows.map((row) => (
        <ListRow key={row.path} title={row.path} subtitle={t(pageSummary(row))} />
      ))}
    </StatSection>
  );
}
