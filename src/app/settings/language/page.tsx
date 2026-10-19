import PageHeader from "@/components/PageHeader";
import LanguageToggle from "@/features/i18n/components/LanguageToggle";
import { STRINGS } from "@/features/i18n/strings";

// Settings > Language: Tiếng Việt or English, a tick on the one in use.
export default function SettingsLanguagePage() {
  return (
    <>
      <PageHeader title={STRINGS.languageLabel} backHref="/settings" />
      <LanguageToggle />
    </>
  );
}
