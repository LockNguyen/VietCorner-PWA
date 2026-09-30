"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { joinGroup } from "../api";
import { STRINGS } from "../strings";

export default function JoinButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { t } = useLanguage(); // I18N

  async function handleClick() {
    try {
      await joinGroup(groupId);
      router.refresh(); // reload the page's server data so the group turns into a link
    } catch (error) {
      alert((error as Error).message);
    }
  }

  return (
    <button onClick={handleClick} className="rounded bg-blue-500 px-4 py-1 text-white">
      {t(STRINGS.joinButton)}
    </button>
  );
}
