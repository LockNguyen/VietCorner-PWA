"use client";

import Button from "@/components/ui/Button";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { signOut } from "../api";
import { STRINGS } from "../strings";

export default function SignOutButton() {
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"signOut">();

  async function handleClick() {
    await signOut();
    // A full page load, not a move inside the app: it empties the pages kept in memory, so the next person
    // to sign in on this phone can never be shown a screen that was loaded for this one.
    window.location.assign("/login");
  }

  return (
    <Button variant="quiet" pending={pending === "signOut"} onClick={() => run("signOut", handleClick)}>
      {t(STRINGS.signOutButton)}
    </Button>
  );
}
