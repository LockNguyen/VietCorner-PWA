"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { useConfirmTap } from "@/lib/useConfirmTap";
import { usePending } from "@/lib/usePending";
import { removeGroup } from "../api";
import { STRINGS } from "../strings";

// The small red line at the bottom of a group's editor: tapped twice, it removes the group and goes back to
// the Groups tab. The group is kept in the database (soft delete), where a mistake can be undone.
export default function RemoveGroupButton({ groupId }: { groupId: string }) {
  const { t } = useLanguage(); // I18N
  const router = useRouter();
  const showBanner = useBanner();
  const { pending, run } = usePending<"remove">();
  const { armed, tap } = useConfirmTap(() =>
    run("remove", async () => {
      try {
        await removeGroup(groupId);
        showBanner({ kind: "success", message: t(COMMON.removed) });
        router.replace("/groups");
      } catch {
        showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
      }
    }),
  );

  return (
    <Button variant="dangerText" pending={pending === "remove"} onClick={tap}>
      {armed ? t(COMMON.tapAgain) : t(STRINGS.removeGroup)}
    </Button>
  );
}
