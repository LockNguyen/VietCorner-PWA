"use client";

import { useRouter } from "next/navigation";
import ActionButton from "@/components/ui/ActionButton";
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
    <ActionButton
      pending={pending === "signOut"}
      onClick={() => run("signOut", handleClick)}
      className="rounded border p-3 text-red-600"
    >
      {t(STRINGS.signOutButton)}
    </ActionButton>
  );
}
