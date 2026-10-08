"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import NameForm from "./NameForm";

// Settings block: my name, and a way to correct it.
export default function NameSection({ name }: { name: string }) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <SectionHeading>{t(STRINGS.nameField)}</SectionHeading>
      <div className="px-3">
        <NameForm name={name} submitLabel={t(COMMON.save)} />
      </div>
    </section>
  );
}
