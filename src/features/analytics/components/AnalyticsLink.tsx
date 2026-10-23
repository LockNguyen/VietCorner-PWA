"use client";

import ListRow from "@/components/ui/ListRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

// The Admin tab's way into the dashboard.
export default function AnalyticsLink() {
  const { t } = useLanguage(); // I18N
  return (
    <section>
      <SectionHeading>{t(STRINGS.heading)}</SectionHeading>
      <ul>
        <ListRow href="/admin/analytics" title={t(STRINGS.open)} />
      </ul>
    </section>
  );
}
