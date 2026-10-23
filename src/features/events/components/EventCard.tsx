"use client";

import PhoneNumber from "@/components/PhoneNumber";
import Place from "@/components/Place";
import PhotoCard from "@/components/ui/PhotoCard";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { wallTime } from "@/lib/churchTime";
import { publicFileUrl } from "@/lib/publicFileUrl";
import { formatShortTime, formatWeekday } from "../formatting";
import { STRINGS } from "../strings";
import { CHURCH_PICTURE, THUMBNAIL_BUCKET, type Occurrence } from "../types";

type Props = {
  occurrences: Occurrence[]; // one day's events at one place (`cardsOf`): usually one, two for Sunday morning
};

// One card of the schedule, one picture. There is no page per event (the user, 2026-10-19).
// Not a link, for anyone: an admin edits from the Edit list (2026-10-21).
// - One event: the title, when ("Thứ 7 · 10:30a"), where (tapped for maps when it has an address), and
//   whom to call.
// - Several at one place (2026-10-20, "Chỉnh lại 1 hình thôi"): the place is the title ("Hội Thánh Báp-Tít
//   Winston-Salem"), then two blocks: the weekday and a line per event ("Thờ Phượng · 10:30a"); the address,
//   tapped for maps, and whom to call.
export default function EventCard({ occurrences }: Props) {
  const { t, language } = useLanguage(); // I18N
  const [first] = occurrences;
  const { event } = first;
  const picture = occurrences.find((date) => date.event.thumbnail_path)?.event.thumbnail_path;
  const src = picture ? publicFileUrl(THUMBNAIL_BUCKET, picture) : CHURCH_PICTURE;
  const contact = event.contact_phone && (
    <span>
      {t(STRINGS.contact)}: <PhoneNumber phone={event.contact_phone} onDark />
    </span>
  );
  // "9:15a", or "9:15a – 10:15a" when it has an end time: the Events tab's short clock (the user, 2026-10-21).
  const hours = (date: Occurrence) =>
    [date.startsAt, date.endsAt].flatMap((at) => (at ? [formatShortTime(wallTime(at).slice(11))] : [])).join(" – ");
  // One event's line on a shared card: "Cancelled" first when it is called off.
  const time = (date: Occurrence) => [date.canceled && t(STRINGS.canceled), hours(date)].filter(Boolean).join(" · ");

  if (occurrences.length > 1) {
    return (
      <PhotoCard
        src={src}
        title={event.text.location ?? event.text.title}
        subtitle={formatWeekday(first.startsAt, language)}
        details={[]}
        extra={
          <span className="flex flex-col gap-3">
            <span className="flex flex-col gap-1">
              {occurrences.map((date) => (
                <span key={date.event.id}>
                  <span className="font-semibold">{date.event.text.title}</span> · {time(date)}
                </span>
              ))}
            </span>
            <span className="flex flex-col gap-1">
              {event.address && <Place name={event.address} address={event.address} onDark />}
              {contact}
            </span>
          </span>
        }
      />
    );
  }

  const { location } = event.text;
  // With an address the place is tapped, so it moves to the card's tappable lines; without one it stays plain.
  const tappablePlace = location && event.address ? <Place name={location} address={event.address} onDark /> : null;

  return (
    <PhotoCard
      src={src}
      title={event.text.title}
      subtitle={[first.canceled && t(STRINGS.canceled), formatWeekday(first.startsAt, language), hours(first)]
        .filter(Boolean)
        .join(" · ")}
      details={location && !tappablePlace ? [location] : []}
      extra={
        (tappablePlace || contact) && (
          <span className="flex flex-col gap-1">
            {tappablePlace}
            {contact}
          </span>
        )
      }
    />
  );
}
