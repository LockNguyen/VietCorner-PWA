"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFreshReport } from "../hooks/useFreshReport";
import { getPathStats } from "../reads";
import { pathSummary, STRINGS } from "../strings";
import type { PathStats, Range } from "../types";
import StatSection from "./StatSection";

// From one screen to the next, most travelled first, with what was tapped on the way.
export default function PathList({ rows: loaded, days }: { rows: PathStats[]; days: Range }) {
  const rows = useFreshReport(loaded, getPathStats, days); // kept copy at once, then a fresh read on arrival
  const { t } = useLanguage(); // I18N
  return (
    <StatSection heading={t(STRINGS.pathsView)} empty={rows.length === 0}>
      {rows.map((row) => (
        <ListRow
          key={`${row.from_path} ${row.via} ${row.to_path}`}
          title={`${row.from_path} → ${row.to_path}`}
          subtitle={t(pathSummary(row))}
        />
      ))}
    </StatSection>
  );
}
