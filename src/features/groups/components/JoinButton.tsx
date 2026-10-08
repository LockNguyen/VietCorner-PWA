"use client";

import { useRouter } from "next/navigation";
import ActionButton from "@/components/ui/ActionButton";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { requestToJoin } from "../api";
import { STRINGS } from "../strings";

export default function JoinButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"join">();

  async function handleClick() {
    try {
      await requestToJoin(groupId);
      router.refresh(); // reload the page's server data so the button turns into "Waiting for approval"
    } catch (error) {
      alert((error as Error).message);
    }
  }

  return (
    <ActionButton
      pending={pending === "join"}
      onClick={() => run("join", handleClick)}
      className="rounded bg-blue-500 px-4 py-1 text-white"
    >
      {t(STRINGS.joinButton)}
    </ActionButton>
  );
}
