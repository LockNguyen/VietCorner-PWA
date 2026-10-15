"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { useConfirmTap } from "@/lib/useConfirmTap";
import { usePending } from "@/lib/usePending";
import { removePerson } from "../api";
import { STRINGS } from "../strings";

// The small red line at the bottom of a person's screen: tapped twice, it deletes their account and goes
// back to the Admin tab. Cannot be undone. Not shown on an admin's own screen.
export default function RemovePersonButton({ userId }: { userId: string }) {
  const { t } = useLanguage(); // I18N
  const router = useRouter();
  const showBanner = useBanner();
  const { pending, run } = usePending<"remove">();
  const { armed, tap } = useConfirmTap(() =>
    run("remove", async () => {
      try {
        await removePerson(userId);
        showBanner({ kind: "success", message: t(STRINGS.removed) });
        router.replace("/admin");
      } catch {
        showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
      }
    }),
  );

  return (
    <Button variant="dangerText" pending={pending === "remove"} onClick={tap}>
      {armed ? t(COMMON.tapAgain) : t(STRINGS.remove)}
    </Button>
  );
}
