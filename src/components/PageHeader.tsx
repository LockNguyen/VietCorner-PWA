"use client";

import { Bot, ChevronLeft, Settings } from "lucide-react";
import IconLink from "@/components/ui/IconLink";
import TopBar from "@/components/ui/TopBar";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { SHELL_STRINGS } from "./strings";

type Props = {
  title: Text | string; // a string is data rather than a label, like a group's name
  backHref?: string; // set on a sub-screen: where its back arrow leads
  plain?: boolean; // no icons at all: the screen shown before signing in
};

// The top bar as this app fills it: the title, a back arrow on sub-screens, the assistant and Settings.
// A Client Component so the title follows the language toggle at once.
export default function PageHeader({ title, backHref, plain = false }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <TopBar
      title={typeof title === "string" ? title : t(title)}
      left={
        backHref && (
          <IconLink href={backHref} label={t(SHELL_STRINGS.back)}>
            <ChevronLeft />
          </IconLink>
        )
      }
      right={
        !plain && (
          <>
            <IconLink href="/assistant" label={t(SHELL_STRINGS.assistantTab)}>
              <Bot />
            </IconLink>
            <IconLink href="/settings" label={t(SHELL_STRINGS.settingsTab)}>
              <Settings />
            </IconLink>
          </>
        )
      }
    />
  );
}
