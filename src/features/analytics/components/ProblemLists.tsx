"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFreshReport } from "../hooks/useFreshReport";
import { getProblems, type Problems } from "../reads";
import { repeatedSummary, slowSummary, STRINGS, timesAndPeople, VITAL_NAMES, vitalSummary, when } from "../strings";
import type { Range } from "../types";
import StatSection from "./StatSection";

type Props = { problems: Problems; days: Range };

// What spoils the app for people, worst first: errors, slow requests, taps that got no answer, slow screens.
export default function ProblemLists({ problems, days }: Props) {
  // kept copy at once, then a fresh read on arrival
  const { errors, slow, repeated, vitals } = useFreshReport(problems, getProblems, days);
  const { t, language } = useLanguage(); // I18N
  return (
    <>
      <StatSection heading={t(STRINGS.errors)} empty={errors.length === 0}>
        {errors.map((row) => (
          <ListRow
            key={`${row.message} ${row.path} ${row.source}`}
            title={row.message}
            subtitle={`${row.path} · ${row.source} · ${t(timesAndPeople(row.times, row.people))} · ${when(row.last_at, language)}`}
          />
        ))}
      </StatSection>
      <StatSection heading={t(STRINGS.slowHeading)} empty={slow.length === 0}>
        {slow.map((row) => (
          <ListRow key={row.request} title={row.request} subtitle={t(slowSummary(row.times, row.p75_ms, row.max_ms))} />
        ))}
      </StatSection>
      <StatSection heading={t(STRINGS.repeatedHeading)} empty={repeated.length === 0}>
        {repeated.map((row) => (
          <ListRow
            key={`${row.path} ${row.target}`}
            title={`“${row.target}”`}
            subtitle={`${row.path} · ${t(repeatedSummary(row.times, row.visits))}`}
          />
        ))}
      </StatSection>
      <StatSection heading={t(STRINGS.vitalsHeading)} empty={vitals.length === 0}>
        {vitals.map((row) => {
          const name = VITAL_NAMES[row.name];
          return (
            <ListRow
              key={`${row.path} ${row.name}`}
              title={`${row.path} · ${name ? t(name) : row.name}`}
              subtitle={t(vitalSummary(row.name, row.p75, row.readings, row.poor))}
            />
          );
        })}
      </StatSection>
    </>
  );
}
