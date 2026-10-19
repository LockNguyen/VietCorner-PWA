"use client";

import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { AVATAR_BUCKET } from "@/features/profiles/types"; // PROFILES
import { publicFileUrl } from "@/lib/publicFileUrl";
import { useFresh } from "@/lib/useFresh";
import { getPeople } from "../api";
import { groupCount, STRINGS } from "../strings";
import type { PersonSummary } from "../types";

// Everyone with an account, one row each: name, then what they are and how many groups. A row opens the
// person's own screen, where their rights and groups are changed. Refreshes itself on every arrival.
export default function PeopleList({ people: loaded }: { people: PersonSummary[] }) {
  const { t } = useLanguage(); // I18N
  const people = useFresh(loaded, getPeople);

  const standing = (person: PersonSummary) =>
    person.roles.length === 0
      ? t(STRINGS.waiting)
      : person.roles.includes("admin")
        ? t(STRINGS.admin)
        : t(STRINGS.member);

  return (
    <section>
      <SectionHeading>{t(STRINGS.heading)}</SectionHeading>
      {people.length === 0 && <EmptyState message={t(STRINGS.nobody)} />}
      <ul>
        {people.map((person) => (
          <ListRow
            key={person.user_id}
            href={`/admin/people/${person.user_id}`}
            leading={<Avatar src={person.avatar_path ? publicFileUrl(AVATAR_BUCKET, person.avatar_path) : undefined} />}
            title={person.name}
            subtitle={`${standing(person)} · ${t(groupCount(person.group_ids.length))}`}
          />
        ))}
      </ul>
    </section>
  );
}
