"use client";

import PhotoCard from "@/components/ui/PhotoCard";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { formatTime, formatWeekday } from "../formatting";
import { STRINGS } from "../strings";
import { THUMBNAIL_BUCKET, type Occurrence } from "../types";

// why: the church's own picture behind every event that has none of its own (the user, 2026-10-19).
const CHURCH_PICTURE = "/images/home/events.png";

type Props = { occurrence: Occurrence };

// One event of the schedule as a card: its picture darkened, then the title, when ("Chúa Nhật · 10:30
// Sáng"), where, and whom to call, "Cancelled" first when it is called off. Opens the event's page, where
// the number can be tapped (a link cannot hold another).
export default function EventCard({ occurrence }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { event, startsAt, canceled } = occurrence;
  const when = [canceled && t(STRINGS.canceled), formatWeekday(startsAt, language), formatTime(startsAt, language)];
  const contact = event.contact_phone && `${t(STRINGS.contact)}: ${event.contact_phone}`;

  return (
    <PhotoCard
      href={`/events/${event.id}`}
      src={event.thumbnail_path ? publicFileUrl(THUMBNAIL_BUCKET, event.thumbnail_path) : CHURCH_PICTURE}
      title={event.text.title}
      subtitle={when.filter(Boolean).join(" · ")}
      details={[event.text.location, contact].filter((line): line is string => Boolean(line))}
    />
  );
}
