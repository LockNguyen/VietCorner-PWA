"use client";

import { Languages } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import RoundIcon from "@/components/ui/RoundIcon";
import { useLanguage } from "../hooks/useLanguage";
import { STRINGS } from "../strings";
import { LANGUAGE_NAMES } from "../types";

// The Settings row for the language: the one in use, opening the screen to choose another.
export default function LanguageRow() {
  const { language, t } = useLanguage();

  return (
    <ListRow
      href="/settings/language"
      leading={<RoundIcon tone="success" size="small"><Languages /></RoundIcon>}
      title={t(STRINGS.languageLabel)}
      value={LANGUAGE_NAMES[language]}
    />
  );
}
