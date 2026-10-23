"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFreshReport } from "../hooks/useFreshReport";
import { getUsageStats } from "../reads";
import { SERVICE_NAMES, STRINGS, usageSummary } from "../strings";
import type { UsageStats, Range } from "../types";
import StatSection from "./StatSection";

// What each person's visits ask of each service, heaviest first: requests, waiting and data, per visit.
export default function UsageList({ rows: loaded, names, days }: { rows: UsageStats[]; names: Partial<Record<string, string>>; days: Range }) {
  const rows = useFreshReport(loaded, getUsageStats, days); // kept copy at once, then a fresh read on arrival
  const { t } = useLanguage(); // I18N
  return (
    <StatSection heading={t(STRINGS.usageView)} empty={rows.length === 0}>
      {rows.map((row) => (
        <ListRow
          key={`${row.user_id} ${row.service}`}
          title={`${names[row.user_id] ?? t(STRINGS.unknown)} · ${t(SERVICE_NAMES[row.service])}`}
          subtitle={t(usageSummary(row))}
        />
      ))}
    </StatSection>
  );
}
