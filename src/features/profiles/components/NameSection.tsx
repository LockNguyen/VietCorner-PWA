"use client";

import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import NameForm from "./NameForm";

type Props = { name: string; requestedName: string | null }; // requestedName: waiting for a manager, if any

// The name screen of Settings: my name, a way to change it, and the name I asked for while it waits for approval.
export default function NameSection({ name, requestedName }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <div className="flex flex-col gap-2 px-3 pt-4">
        <NameForm name={name} submitLabel={t(COMMON.save)} />
        {requestedName && (
          <Text variant="small" tone="subtle">
            {t(STRINGS.waitingForApproval)}: {requestedName}
          </Text>
        )}
      </div>
    </section>
  );
}
