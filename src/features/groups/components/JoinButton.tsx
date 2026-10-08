"use client";

import ActionButton from "@/components/ui/ActionButton";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { useRefresh } from "@/lib/useRefresh";
import { requestToJoin } from "../api";
import { STRINGS } from "../strings";

export default function JoinButton({ groupId }: { groupId: string }) {
  const refresh = useRefresh();
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"join">();

  async function handleClick() {
    try {
      await requestToJoin(groupId);
      await refresh(); // the button has turned into "Waiting for approval" before it stops looking busy
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
