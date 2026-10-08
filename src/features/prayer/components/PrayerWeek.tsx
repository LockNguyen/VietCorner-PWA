"use client";

import Avatar from "@/components/ui/Avatar";
import BubbleRun from "@/components/ui/BubbleRun";
import TimeLine from "@/components/ui/TimeLine";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import type { PersonGroup, WeekGroup } from "../grouping";
import { STRINGS, weeksAgo } from "../strings";
import type { PrayerRequest } from "../types";
import PrayerBubble from "./PrayerBubble";

type Props = {
  week: WeekGroup;
  canPrayFor: (requestId: string) => boolean;
  onPray: (requestId: string) => void;
  onManage: (request: PrayerRequest) => void;
};

// One week of the prayer list: its label, then each person's requests as a run of bubbles under their name.
// All at the left, mine included: this is a list to read through, not a conversation with two sides.
export default function PrayerWeek({ week, canPrayFor, onPray, onManage }: Props) {
  const { t, language } = useLanguage(); // I18N

  // "This week" … "3 weeks ago", then the week's own date: further back, a count stops meaning anything.
  function label(): string {
    if (week.weeksAgo === 0) return t(STRINGS.thisWeek);
    if (week.weeksAgo === 1) return t(STRINGS.lastWeek);
    if (week.weeksAgo <= 3) return t(weeksAgo(week.weeksAgo));

    // Noon UTC on the week's Sunday, printed in UTC: the calendar date and nothing a timezone can move.
    const sunday = new Date(`${week.start}T12:00:00Z`);
    return `${t(STRINGS.weekOf)} ${sunday.toLocaleDateString(LOCALES[language], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}`;
  }

  function nameOf(person: PersonGroup): string {
    if (person.name === null) return t(STRINGS.anonymous);
    return person.mine ? `${person.name} (${t(STRINGS.you)})` : person.name;
  }

  return (
    <section className="flex flex-col gap-4 px-3">
      <TimeLine>{label()}</TimeLine>
      {week.people.map((person) => (
        <BubbleRun key={`${person.name}-${person.mine}`} side="theirs" name={nameOf(person)} avatar={<Avatar />}>
          {person.requests.map((request) => (
            <PrayerBubble
              key={request.id}
              request={request}
              canPray={canPrayFor(request.id)}
              onPray={() => onPray(request.id)}
              onManage={() => onManage(request)}
            />
          ))}
        </BubbleRun>
      ))}
    </section>
  );
}
