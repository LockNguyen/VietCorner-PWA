"use client";

import LogoMark from "@/components/ui/LogoMark";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import NameForm from "./NameForm";

// The one question asked after the first sign-in. The layout shows it in place of every screen until it
// is answered, so nobody writes anything under their email's stand-in.
export default function NameStep() {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex flex-col items-center gap-6 px-5 pt-12">
      <LogoMark />
      <div className="flex flex-col gap-2 text-center">
        <Text as="h1" variant="tile">{t(STRINGS.askName)}</Text>
        <Text tone="subtle">{t(STRINGS.whoSeesIt)}</Text>
      </div>
      <NameForm name="" submitLabel={t(STRINGS.continue)} />
    </div>
  );
}
