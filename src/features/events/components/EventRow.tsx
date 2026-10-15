"use client";

import ListRow from "@/components/ui/ListRow";
import RowLabel from "@/components/ui/RowLabel";
import Thumbnail from "@/components/ui/Thumbnail";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { formatTime } from "../formatting";
import { STRINGS } from "../strings";
import { THUMBNAIL_BUCKET, type Occurrence } from "../types";

type Props = { occurrence: Occurrence; onOpen: () => void };

// One line of the schedule: the time, the picture, the title, and what else matters at a glance.
export default function EventRow({ occurrence, onOpen }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { event, startsAt, canceled } = occurrence;
  const notes = [canceled && t(STRINGS.canceled), event.text.location];

  return (
    <ListRow
      onClick={onOpen}
      leading={
        <>
          <RowLabel>{formatTime(startsAt, language)}</RowLabel>
          <Thumbnail src={event.thumbnail_path ? publicFileUrl(THUMBNAIL_BUCKET, event.thumbnail_path) : undefined} />
        </>
      }
      title={event.text.title}
      subtitle={notes.filter(Boolean).join(" · ")}
      tone={canceled ? "off" : "normal"}
    />
  );
}
