"use client";

import Button from "@/components/ui/Button";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useConfirmTap } from "@/lib/useConfirmTap";
import { usePending } from "@/lib/usePending";
import { signOut } from "../api";
import { STRINGS } from "../strings";

// Signs out and returns to sign-in: a red button at the foot of Settings, tapped twice (the user, 2026-10-19),
// because signing back in means waiting for an email.
export default function SignOutButton() {
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"signOut">();
  const { armed, tap } = useConfirmTap(() => run("signOut", handleClick));

  async function handleClick() {
    await signOut();
    // A full page load, not a move inside the app: it empties the pages kept in memory, so the next person
    // to sign in on this phone can never be shown a screen that was loaded for this one.
    window.location.assign("/login");
  }

  return (
    <Button variant="dangerOutline" pending={pending === "signOut"} onClick={tap}>
      {armed ? t(COMMON.tapAgain) : t(STRINGS.signOutButton)}
    </Button>
  );
}
