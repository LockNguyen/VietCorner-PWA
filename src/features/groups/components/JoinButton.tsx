"use client";

import Button from "@/components/ui/Button";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { requestToJoin } from "../api";
import { STRINGS } from "../strings";

// Asks to join a group. Once sent, the reloaded list shows "Waiting for approval" in its place.
export default function JoinButton({ groupId }: { groupId: string }) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"join">();
  const says = { done: t(STRINGS.requestSent), failed: t(COMMON.couldNotSave) };

  return (
    <Button variant="quiet" pending={pending === "join"} onClick={() => save("join", () => requestToJoin(groupId), says)}>
      {t(STRINGS.joinButton)}
    </Button>
  );
}
