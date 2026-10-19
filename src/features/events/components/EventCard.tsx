"use client";

import PhoneNumber from "@/components/PhoneNumber";
import PhotoCard from "@/components/ui/PhotoCard";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { formatTime, formatWeekday } from "../formatting";
import { STRINGS } from "../strings";
import { THUMBNAIL_BUCKET, type Occurrence } from "../types";

// why: the church's own picture behind every event that has none of its own (the user, 2026-10-19).
const CHURCH_PICTURE = "/images/home/events.png";

type Props = {
  occurrence: Occurrence;
  canManage: boolean; // an admin: a tap opens the event's editor; for everyone else the card is not a button
};

// One event of the schedule as a card: its picture darkened, then the title, when ("Chúa Nhật · 10:30
// Sáng"), where, and whom to call, "Cancelled" first when it is called off. There is no page per event (the
// user, 2026-10-19): for an admin a tap opens the editor; the number opens its call / text / copy menu.
export default function EventCard({ occurrence, canManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { event, startsAt, canceled } = occurrence;
  const when = [canceled && t(STRINGS.canceled), formatWeekday(startsAt, language), formatTime(startsAt, language)];

  return (
    <PhotoCard
      href={canManage ? `/events/${event.id}/edit` : undefined}
      src={event.thumbnail_path ? publicFileUrl(THUMBNAIL_BUCKET, event.thumbnail_path) : CHURCH_PICTURE}
      title={event.text.title}
      subtitle={when.filter(Boolean).join(" · ")}
      details={event.text.location ? [event.text.location] : []}
      extra={
        event.contact_phone && (
          <>
            {t(STRINGS.contact)}: <PhoneNumber phone={event.contact_phone} onDark />
          </>
        )
      }
    />
  );
}
