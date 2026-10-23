"use client";

import { Bot, ChevronLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import Avatar from "@/components/ui/Avatar";
import IconLink from "@/components/ui/IconLink";
import TopBar from "@/components/ui/TopBar";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { Text } from "@/features/i18n/types"; // I18N
import { backTarget, directionOf } from "@/lib/navigation";
import { slideOf } from "@/lib/slide";
import { useSwipeBack } from "@/lib/useSwipeBack";
import { useMyPicture } from "./MyPicture";
import { useNavigation } from "./Navigation";
import { SHELL_STRINGS } from "./strings";

type Props = {
  title: Text | string; // a string is data rather than a label, like a group's name
  backHref?: string; // where its back arrow leads: Home for a main tab, the list for a screen opened from one
  // (a screen opened from another section goes back to where it was opened from: src/lib/navigation.ts `backTarget`)
  plain?: boolean; // no icons at all: the screen shown before signing in
};

// The top bar as this app fills it: the title, a back arrow on every screen but Home, the assistant and
// Settings, which is the person's own picture (the user, 2026-10-20: "me" is recognised faster than a gear).
// Back slides this screen away to the right (also by a swipe from the left edge, in the installed app) and lands
// the screen behind where it was left; the two icons slide theirs in. A Client Component so the title follows
// the language toggle at once.
export default function PageHeader({ title, backHref, plain = false }: Props) {
  const { t } = useLanguage(); // I18N
  const pathname = usePathname();
  const router = useRouter();
  const { aside, restoreOnArrival } = useNavigation();
  const back = backHref && backTarget(pathname, backHref, aside);
  const backMove = back ? slideOf(directionOf(pathname, back, "back")) : undefined; // Staff to Home switches
  const openMove = (href: string) => slideOf(directionOf(pathname, href, "open"));
  const goBack = useCallback(() => {
    if (!back) return;
    restoreOnArrival(back);
    router.push(back, { transitionTypes: backMove, scroll: false });
  }, [back, backMove, restoreOnArrival, router]);
  useSwipeBack(back ? goBack : undefined);
  const myPicture = useMyPicture();

  return (
    <TopBar
      stays
      title={typeof title === "string" ? title : t(title)}
      left={
        back && (
          // A link, so it is one to the browser too; `scroll={false}`: the screen behind keeps where it was left.
          <IconLink
            href={back}
            transitionTypes={backMove}
            scroll={false}
            onClick={() => restoreOnArrival(back)}
            label={t(SHELL_STRINGS.back)}
          >
            <ChevronLeft />
          </IconLink>
        )
      }
      right={
        !plain && (
          <>
            <IconLink href="/assistant" transitionTypes={openMove("/assistant")} label={t(SHELL_STRINGS.assistantTab)}>
              <Bot />
            </IconLink>
            <IconLink href="/settings" transitionTypes={openMove("/settings")} label={t(SHELL_STRINGS.settingsTab)}>
              <Avatar src={myPicture} />
            </IconLink>
          </>
        )
      }
    />
  );
}
