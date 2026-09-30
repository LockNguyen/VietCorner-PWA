"use client";

import { useRouter } from "next/navigation";
import { signOut } from "../api";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

export default function SignOutButton() {
  const router = useRouter();
  const { t } = useLanguage(); // I18N

  async function handleClick() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="rounded border p-3 text-red-600">
      {t(STRINGS.signOutButton)}
    </button>
  );
}
