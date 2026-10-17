"use client";

import { CalendarDays } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import Thumbnail from "@/components/ui/Thumbnail";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { formatTime } from "../formatting";
import { STRINGS } from "../strings";
import { THUMBNAIL_BUCKET, type Occurrence } from "../types";

type Props = { occurrence: Occurrence };

// One line of the schedule, shaped like a row of the Admin tab's people: the picture, the title, and under it
// the time and the place ("7:00 Tối · Hội trường"), "Cancelled" first when it is called off. Opens the event's page.
export default function EventRow({ occurrence }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { event, startsAt, canceled } = occurrence;
  const notes = [canceled && t(STRINGS.canceled), formatTime(startsAt, language), event.text.location];

  return (
    <ListRow
      href={`/events/${event.id}`}
      leading={
        <Thumbnail src={event.thumbnail_path ? publicFileUrl(THUMBNAIL_BUCKET, event.thumbnail_path) : undefined}>
          <CalendarDays />
        </Thumbnail>
      }
      title={event.text.title}
      subtitle={notes.filter(Boolean).join(" · ")}
      tone={canceled ? "off" : "normal"}
    />
  );
}
