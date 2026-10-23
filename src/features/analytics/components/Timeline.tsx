"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useFreshTimeline } from "../hooks/useFreshReport";
import { describeEvent, STRINGS, when } from "../strings";
import type { AnalyticsEvent, Range } from "../types";
import StatSection from "./StatSection";

// One person's events, newest first: the screens they opened, what they tapped, what went wrong.
export default function Timeline({ events: loaded, userId, days }: { events: AnalyticsEvent[]; userId: string; days: Range }) {
  const events = useFreshTimeline(loaded, userId, days); // kept copy at once, then a fresh read on arrival
  const { t, language } = useLanguage(); // I18N
  return (
    <StatSection heading={t(STRINGS.heading)} empty={events.length === 0}>
      {events.map((event, index) => (
        <ListRow
          key={index}
          title={t(describeEvent(event))}
          subtitle={`${when(event.at, language)} · ${event.path}`}
        />
      ))}
    </StatSection>
  );
}
