"use client";

import Button from "@/components/ui/Button";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useConfirmTap } from "@/lib/useConfirmTap";
import { STRINGS } from "../strings";

type Action = "answered" | "edit" | "delete";
type Props = { pending: Action | null; onAnswered: () => void; onEdit: () => void; onDelete: () => void };

// A request's three options, quietest last: "answered" in blue, "edit", and "delete" as a small red line
// that asks once ("tap again") before it deletes.
export default function OptionButtons({ pending, onAnswered, onEdit, onDelete }: Props) {
  const { t } = useLanguage(); // I18N
  const { armed, tap } = useConfirmTap(onDelete);

  return (
    <div className="flex flex-col gap-3">
      <Button pending={pending === "answered"} disabled={pending !== null} onClick={onAnswered}>
        {t(STRINGS.markAnswered)}
      </Button>
      <Button variant="quiet" disabled={pending !== null} onClick={onEdit}>
        {t(STRINGS.editRequest)}
      </Button>
      <Button variant="dangerText" pending={pending === "delete"} disabled={pending !== null && pending !== "delete"} onClick={tap}>
        {armed ? t(COMMON.tapAgain) : t(STRINGS.deleteRequest)}
      </Button>
    </div>
  );
}
