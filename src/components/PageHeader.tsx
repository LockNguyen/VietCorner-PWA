"use client";

import { Bot, ChevronLeft } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import IconLink from "@/components/ui/IconLink";
import TopBar from "@/components/ui/TopBar";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { GO_BACK, GO_FORWARD } from "@/lib/slide";
import { useSwipeBack } from "@/lib/useSwipeBack";
import { useMyPicture } from "./MyPicture";
import { SHELL_STRINGS } from "./strings";

type Props = {
  title: Text | string; // a string is data rather than a label, like a group's name
  backHref?: string; // where its back arrow leads: Home for a main tab, the list for a screen opened from one
  plain?: boolean; // no icons at all: the screen shown before signing in
};

// The top bar as this app fills it: the title, a back arrow on every screen but Home, the assistant and
// Settings, which is the person's own picture (the user, 2026-10-20: "me" is recognised faster than a gear).
// Back slides this screen away to the right (also by a swipe from the left edge, in the installed app); the two
// icons slide theirs in. A Client Component so the title follows the language toggle at once.
export default function PageHeader({ title, backHref, plain = false }: Props) {
  const { t } = useLanguage(); // I18N
  useSwipeBack(backHref);
  const myPicture = useMyPicture();

  return (
    <TopBar
      title={typeof title === "string" ? title : t(title)}
      left={
        backHref && (
          <IconLink href={backHref} transitionTypes={GO_BACK} label={t(SHELL_STRINGS.back)}>
            <ChevronLeft />
          </IconLink>
        )
      }
      right={
        !plain && (
          <>
            <IconLink href="/assistant" transitionTypes={GO_FORWARD} label={t(SHELL_STRINGS.assistantTab)}>
              <Bot />
            </IconLink>
            <IconLink href="/settings" transitionTypes={GO_FORWARD} label={t(SHELL_STRINGS.settingsTab)}>
              <Avatar src={myPicture} />
            </IconLink>
          </>
        )
      }
    />
  );
}
