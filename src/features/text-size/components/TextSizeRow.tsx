"use client";

import { ALargeSmall } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import RoundIcon from "@/components/ui/RoundIcon";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useTextSize } from "../hooks/useTextSize";
import { SIZES, STRINGS } from "../strings";

// The Settings row for text size: the size chosen now, opening the screen to choose another.
export default function TextSizeRow() {
  const { t } = useLanguage(); // I18N
  const { size } = useTextSize();
  const current = SIZES.find((option) => option.size === size);

  return (
    <ListRow
      href="/settings/text-size"
      leading={<RoundIcon tone="caution" size="small"><ALargeSmall /></RoundIcon>}
      title={t(STRINGS.heading)}
      value={current && t(current.label)}
    />
  );
}
