"use client";

import Button from "@/components/ui/Button";
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
    <Button variant="quiet" pending={pending === "join"} onClick={() => run("join", handleClick)}>
      {t(STRINGS.joinButton)}
    </Button>
  );
}
