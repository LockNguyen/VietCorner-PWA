"use client";

import PhoneNumber from "@/components/PhoneNumber";
import Place from "@/components/Place";
import PhotoCard from "@/components/ui/PhotoCard";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatShortTime, weekdayName } from "../formatting";
import { STRINGS } from "../strings";
import { CHURCH_PICTURE, type WeeklyCard, type WeeklyLine } from "../types";
import { byWeekday } from "../weekly";

type Props = {
  card: WeeklyCard;
  lines: WeeklyLine[]; // the weekly events and the groups' meetings, in any order
};

// The Events tab's first card (the user, 2026-10-21): the church picture with room above the words, the church's
// name, its address (tapped for maps) and number, then each weekday that has something, Sunday first, with a
// line per thing in time order, set in a little: "Thờ Phượng · 10:30a". No dates: these happen every week.
export default function EventWeeklyCard({ card, lines }: Props) {
  const { t, language } = useLanguage(); // I18N

  return (
    <PhotoCard
      src={CHURCH_PICTURE}
      title={t({ vi: card.title, en: card.title_en ?? "" })}
      extra={
        <span className="flex flex-col gap-4">
          <span className="flex flex-col gap-1">
            {card.address && <Place name={card.address} address={card.address} onDark />}
            {card.contact_phone && (
              <span>
                {t(STRINGS.contact)}: <PhoneNumber phone={card.contact_phone} onDark />
              </span>
            )}
          </span>
          {byWeekday(lines).map(([weekday, ofThatDay]) => (
            <span key={weekday} className="flex flex-col gap-1">
              <span className="font-bold">{weekdayName(weekday, language)}</span>
              {ofThatDay.map((line, index) => (
                <span key={index} className="ps-4">
                  {line.title} · {formatShortTime(line.time)}
                </span>
              ))}
            </span>
          ))}
        </span>
      }
    />
  );
}
