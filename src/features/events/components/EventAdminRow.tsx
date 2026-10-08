"use client";

import ListRow from "@/components/ui/ListRow";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatLongDate, formatTime } from "../formatting";
import { STRINGS } from "../strings";
import type { ManagedEvent } from "../types";

type Props = {
  event: ManagedEvent;
  groupName: string | undefined; // undefined = church-wide
  href: string; // its editor
};

// One event in the admin list: what it is, who it is for and when it is next. Tapping it opens the editor.
export default function EventAdminRow({ event, groupName, href }: Props) {
  const { t, language } = useLanguage(); // I18N
  // The admin's own language first; an event written in one language only still has a name.
  const title = (event.texts[language] ?? event.texts.en ?? event.texts.vi)?.title ?? t(STRINGS.untitled);
  const next = event.upcoming.find((date) => !date.canceled);
  const when = next && `${formatLongDate(new Date(next.startsAt), language)}, ${formatTime(new Date(next.startsAt), language)}`;

  return (
    <ListRow
      href={href}
      title={title}
      subtitle={[groupName ?? t(STRINGS.churchWide), event.repeats_weekly && t(STRINGS.everyWeek), when].filter(Boolean).join(" · ")}
    />
  );
}
