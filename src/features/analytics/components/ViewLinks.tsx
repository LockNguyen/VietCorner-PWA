"use client";

import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import type { Range } from "../types";

const VIEWS = [
  { slug: "pages", name: STRINGS.pagesView },
  { slug: "people", name: STRINGS.peopleView },
  { slug: "paths", name: STRINGS.pathsView },
  { slug: "problems", name: STRINGS.problemsView },
  { slug: "usage", name: STRINGS.usageView },
];

// The dashboard's deeper screens, each for the same period.
export default function ViewLinks({ days }: { days: Range }) {
  const { t } = useLanguage(); // I18N
  return (
    <section>
      <SectionHeading>{t(STRINGS.closer)}</SectionHeading>
      <ul>
        {VIEWS.map(({ slug, name }) => (
          <ListRow key={slug} href={`/admin/analytics/${slug}?days=${days}`} title={t(name)} />
        ))}
      </ul>
    </section>
  );
}
