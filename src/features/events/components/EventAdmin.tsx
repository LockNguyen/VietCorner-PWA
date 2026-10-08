"use client";

import { Plus } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import Thumbnail from "@/components/ui/Thumbnail";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { EventGroup, ManagedEvent } from "../types";
import EventAdminRow from "./EventAdminRow";

type Props = {
  events: ManagedEvent[];
  groups: EventGroup[];
  editorPath: string; // the editor's screen is `<editorPath>/<event id>`, or `<editorPath>/new`
};

// The admin page's section for events: a row that starts a new one, then every upcoming event in every
// group. Each opens the editor. Shown only to someone with the "events.manage" permission.
export default function EventAdmin({ events, groups, editorPath }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <SectionHeading>{t(STRINGS.adminHeading)}</SectionHeading>
      <ul>
        <ListRow href={`${editorPath}/new`} leading={<Thumbnail><Plus /></Thumbnail>} title={t(STRINGS.newEvent)} />
        {events.map((event) => (
          <EventAdminRow
            key={event.id}
            event={event}
            groupName={groups.find((group) => group.id === event.group_id)?.name}
            href={`${editorPath}/${event.id}`}
          />
        ))}
      </ul>
    </section>
  );
}
