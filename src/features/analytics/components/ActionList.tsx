"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFreshReport } from "../hooks/useFreshReport";
import { getActionStats } from "../reads";
import { actionName, STRINGS, timesAndPeople } from "../strings";
import type { ActionStats, Range } from "../types";
import StatSection from "./StatSection";

// How much people pray and use the worship music in the period (the user, 2026-10-22): each action, most used
// first, with how many times and by how many people.
export default function ActionList({ rows: loaded, days }: { rows: ActionStats[]; days: Range }) {
  const rows = useFreshReport(loaded, getActionStats, days); // kept copy at once, then a fresh read on arrival
  const { t } = useLanguage(); // I18N
  return (
    <StatSection heading={t(STRINGS.actions)} empty={rows.length === 0}>
      {rows.map((row) => (
        <ListRow key={row.action} title={t(actionName(row.action))} value={t(timesAndPeople(row.times, row.people))} />
      ))}
    </StatSection>
  );
}
