"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import PhoneNumber from "@/components/PhoneNumber";
import Place from "@/components/Place";
import PhotoCard from "@/components/ui/PhotoCard";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { GO_FORWARD } from "@/lib/slide";
import { weekdayName } from "@/features/i18n/clock"; // I18N
import { formatShortTime } from "../formatting";
import { STRINGS } from "../strings";
import { CHURCH_PICTURE, type WeeklyCard, type WeeklyLine } from "../types";
import { byWeekday } from "../weekly";

type Props = {
  card: WeeklyCard;
  lines: WeeklyLine[]; // the weekly events and the groups' meetings, in any order
};

// A group's line: the words, then the button at the end, both centred on the line's middle. `-my-1` keeps the
// 32 px button from spreading the day's lines apart. The arrow fills most of it, bold (the user, 2026-10-22: the
// thin arrow left the white button mostly empty).
const LINE_LINK =
  "flex items-center justify-between gap-3 rounded-control focus-visible:outline-2 focus-visible:outline-on-action";
const ARROW = "-my-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-action";

// The Events tab's first card (the user, 2026-10-21): the church picture with room above the words, the church's
// name, its address (tapped for maps) and number, then each weekday that has something, Sunday first, with a
// line per thing in time order, set in a little: "Thờ Phượng · 10:30a". No dates: these happen every week.
// Spacing (the user, 2026-10-22: overwhelming, lines spilling over): days set apart, a day's lines close together,
// and a line too long for the screen keeps its time with its last word and continues further in, under its name.
// A group's line opens the group's page (the user, 2026-10-22): the whole line is the link, so it is easy to hit,
// and it ends in a round white button with a blue arrow, centred on the line, that says so.
export default function EventWeeklyCard({ card, lines }: Props) {
  const { t, language } = useLanguage(); // I18N

  return (
    <PhotoCard
      src={CHURCH_PICTURE}
      title={t({ vi: card.title, en: card.title_en ?? "" })}
      extra={
        <span className="flex flex-col gap-3">
          {/* Labels in a column of their own, so a long address wraps under itself, not under "Địa điểm:". */}
          {/* `mb-3`: the church's lines and the week's set apart (the user, 2026-10-22: contact ran into Sunday). */}
          <span className="mb-3 grid grid-cols-[auto_1fr] items-baseline gap-x-2 gap-y-1">
            {card.address && (
              <>
                <span>{t(STRINGS.location)}:</span>
                <Place name={card.address} address={card.address} onDark />
              </>
            )}
            {card.contact_phone && (
              <>
                <span>{t(STRINGS.contact)}:</span>
                <PhoneNumber phone={card.contact_phone} onDark />
              </>
            )}
          </span>
          {byWeekday(lines).map(([weekday, ofThatDay]) => (
            <span key={weekday} className="flex flex-col gap-0.5">
              <span className="font-bold">{weekdayName(weekday, language)}</span>
              {ofThatDay.map((line, index) => {
                const words = (
                  <span className="ps-6 -indent-3">
                    {line.title}
                    <span className="whitespace-nowrap"> · {formatShortTime(line.time)}</span>
                  </span>
                );
                return line.href ? (
                  <Link key={index} href={line.href} transitionTypes={GO_FORWARD} className={LINE_LINK}>
                    {words}
                    <span aria-hidden className={ARROW}>
                      <ChevronRight className="size-6" strokeWidth={3} />
                    </span>
                  </Link>
                ) : (
                  <span key={index}>{words}</span>
                );
              })}
            </span>
          ))}
        </span>
      }
    />
  );
}
