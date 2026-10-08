"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { signOut } from "../api";
import { STRINGS } from "../strings";

export default function SignOutButton() {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"signOut">();

  async function handleClick() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="quiet" pending={pending === "signOut"} onClick={() => run("signOut", handleClick)}>
      {t(STRINGS.signOutButton)}
    </Button>
  );
}
