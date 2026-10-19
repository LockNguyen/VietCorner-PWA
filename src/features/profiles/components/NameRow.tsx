"use client";

import { UserRound } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import RoundIcon from "@/components/ui/RoundIcon";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

// The Settings row for my name: it shows the name and opens the screen that changes it.
export default function NameRow({ name }: { name: string }) {
  const { t } = useLanguage(); // I18N

  return (
    <ListRow
      href="/settings/name"
      leading={<RoundIcon tone="action" size="small"><UserRound /></RoundIcon>}
      title={t(STRINGS.nameField)}
      value={name}
    />
  );
}
