"use client";

import ListRow from "@/components/ui/ListRow";
import RowLabel from "@/components/ui/RowLabel";
import Thumbnail from "@/components/ui/Thumbnail";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatTime } from "../formatting";
import { STRINGS } from "../strings";
import type { Occurrence } from "../types";

type Props = { occurrence: Occurrence; onOpen: () => void };

// One line of the schedule: the time, the picture, the title, and what else matters at a glance.
export default function EventRow({ occurrence, onOpen }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { event, startsAt, canceled } = occurrence;
  const notes = [canceled && t(STRINGS.canceled), event.text.location, event.group_id && t(STRINGS.groupOnly)];

  return (
    <ListRow
      onClick={onOpen}
      leading={
        <>
          <RowLabel>{formatTime(startsAt, language)}</RowLabel>
          <Thumbnail />
        </>
      }
      title={event.text.title}
      subtitle={notes.filter(Boolean).join(" · ")}
      tone={canceled ? "off" : "normal"}
    />
  );
}
