"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFreshReport } from "../hooks/useFreshReport";
import { getPeopleStats } from "../reads";
import { personSummary, STRINGS, when } from "../strings";
import type { PersonStats, Range } from "../types";
import StatSection from "./StatSection";

// Each person, most recently seen first. A row opens their timeline for the same period.
export default function PeopleStatsList({ rows: loaded, names, days }: { rows: PersonStats[]; names: Partial<Record<string, string>>; days: Range }) {
  const rows = useFreshReport(loaded, getPeopleStats, days); // kept copy at once, then a fresh read on arrival
  const { t, language } = useLanguage(); // I18N
  return (
    <StatSection heading={t(STRINGS.peopleView)} empty={rows.length === 0}>
      {rows.map((row) => (
        <ListRow
          key={row.user_id}
          href={`/admin/analytics/people/${row.user_id}?days=${days}`}
          title={names[row.user_id] ?? t(STRINGS.unknown)}
          subtitle={`${t(personSummary(row))} · ${when(row.last_at, language)}`}
        />
      ))}
    </StatSection>
  );
}
