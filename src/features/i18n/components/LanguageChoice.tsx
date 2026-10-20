"use client";

import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import Text from "@/components/ui/Text";
import { APP_NAME } from "@/lib/appName";
import { useLanguage } from "../hooks/useLanguage";
import { STRINGS } from "../strings";
import { LANGUAGE_NAMES, type Language } from "../types";

// The website's first screen (the install feature shows it before its guide): the app's name under the logo, then
// which language? The question is written in both, since nobody has chosen yet, and each answer in its own
// language. Not shown in the installed app: whoever installed it chose here first (the user, 2026-10-20).
export default function LanguageChoice({ onChosen }: { onChosen: () => void }) {
  const { setLanguage } = useLanguage();

  function choose(language: Language) {
    setLanguage(language);
    onChosen();
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-surface px-5 pb-safe">
      <LogoMark />
      <Text variant="tile">{APP_NAME}</Text>
      {/* More room between the name and the question than between the other parts (the user, 2026-10-20). */}
      <div className="mt-6 flex flex-col items-center gap-1 text-center">
        <Text as="h1" variant="tile">
          {STRINGS.chooseLanguage.vi}
        </Text>
        <Text tone="subtle">{STRINGS.chooseLanguage.en}</Text>
      </div>
      <div className="flex w-full max-w-column flex-col gap-3">
        <Button onClick={() => choose("vi")}>{LANGUAGE_NAMES.vi}</Button>
        <Button variant="quiet" onClick={() => choose("en")}>
          {LANGUAGE_NAMES.en}
        </Button>
      </div>
    </div>
  );
}
