"use client";

import { CalendarDays, Clock, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import PhoneNumber from "@/components/PhoneNumber";
import Button from "@/components/ui/Button";
import IconLine from "@/components/ui/IconLine";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { formatLongDate, formatTime } from "../formatting";
import { nextOfEach, scheduleOf } from "../occurrences";
import { STRINGS } from "../strings";
import { THUMBNAIL_BUCKET, type ScheduledEvent } from "../types";

type Props = {
  event: ScheduledEvent;
  canManage: boolean; // an admin: an Edit button at the bottom
};

// One event, as its own screen sliding in from the right: a big picture, then three facts with icons
// (when, where, whom to call) and what it is about. Kept short on purpose: elderly members read it at a glance.
export default function EventPage({ event, canManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const router = useRouter();
  const [next] = nextOfEach(scheduleOf([event], language, new Date()));
  const text = event.texts[language] ?? Object.values(event.texts)[0];
  const picture = event.thumbnail_path ? publicFileUrl(THUMBNAIL_BUCKET, event.thumbnail_path) : undefined;

  return (
    <div className="flex flex-col gap-5 px-3 pt-3 pb-6 motion-safe:animate-slide-in">
      <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-control bg-fill text-subtle">
        {picture ? <img src={picture} alt="" className="size-full object-cover" /> : <CalendarDays className="size-12" />}
      </div>

      <div className="flex flex-col gap-4">
        {next && (
          <IconLine icon={<Clock />} label={t(STRINGS.time)}>
            <span>{formatLongDate(next.startsAt, language)}</span>
            <span>
              {formatTime(next.startsAt, language)}
              {next.endsAt && ` – ${formatTime(next.endsAt, language)}`}
              {event.repeats_weekly && ` · ${t(STRINGS.everyWeek)}`}
            </span>
          </IconLine>
        )}
        {text?.location && (
          <IconLine icon={<MapPin />} label={t(STRINGS.location)}>
            {text.location}
          </IconLine>
        )}
        {event.contact_phone && (
          <IconLine icon={<Phone />} label={t(STRINGS.contact)}>
            <PhoneNumber phone={event.contact_phone} />
          </IconLine>
        )}
      </div>

      {text?.description && (
        <div className="whitespace-pre-wrap">
          <Text>{text.description}</Text>
        </div>
      )}

      {canManage && (
        <Button variant="quiet" onClick={() => router.push(`/events/${event.id}/edit`)}>
          {t(STRINGS.editEvent)}
        </Button>
      )}
    </div>
  );
}
