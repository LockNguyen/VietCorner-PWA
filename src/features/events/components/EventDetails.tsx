"use client";

import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { formatLongDate, formatTime } from "../formatting";
import { STRINGS } from "../strings";
import type { Occurrence } from "../types";

type Props = { occurrence: Occurrence; onClose: () => void };

// Everything about one date: when it starts and ends, where, what it is about, and whether it repeats.
// A sheet rather than a route, because the schedule stays behind it and nothing is shareable yet.
export default function EventDetails({ occurrence, onClose }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { event, startsAt, endsAt, canceled } = occurrence;

  return (
    <Sheet title={event.text.title} onClose={onClose}>
      {canceled && <Text tone="danger">{t(STRINGS.canceled)}</Text>}

      <Text>
        {formatLongDate(startsAt, language)}
        {" · "}
        {formatTime(startsAt, language)}
        {endsAt && ` – ${formatTime(endsAt, language)}`}
      </Text>

      {event.repeats_weekly && <Text tone="subtle">{t(STRINGS.everyWeek)}</Text>}

      {event.text.location && (
        <Text>
          <Text as="span" tone="subtle">{t(STRINGS.location)}: </Text>
          {event.text.location}
        </Text>
      )}

      {event.text.description && (
        <div className="whitespace-pre-wrap">
          <Text>{event.text.description}</Text>
        </div>
      )}

      <Button variant="quiet" onClick={onClose}>
        {t(STRINGS.close)}
      </Button>
    </Sheet>
  );
}
