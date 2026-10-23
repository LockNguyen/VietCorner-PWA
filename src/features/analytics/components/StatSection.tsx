"use client";

import type { ReactNode } from "react";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

// One list of the dashboard under its heading; says so when the period has nothing to show. Children are `ListRow`s.
export default function StatSection({ heading, empty, children }: { heading: string; empty: boolean; children: ReactNode }) {
  const { t } = useLanguage(); // I18N
  return (
    <section>
      <SectionHeading>{heading}</SectionHeading>
      {empty ? <EmptyState message={t(STRINGS.nothing)} /> : <ul>{children}</ul>}
    </section>
  );
}
