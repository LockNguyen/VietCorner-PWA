"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";
import RequestEditor from "./RequestEditor";

type Props = {
  request: PrayerRequest;
  onAnswered: () => Promise<boolean>;
  onEdit: (body: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onClose: () => void;
};

// What an author can do with their own request: mark it answered, edit it, delete it, or change their mind.
// One tap each, with no "are you sure?": the sheet itself is the second step after the X.
export default function RequestOptions({ request, onAnswered, onEdit, onDelete, onClose }: Props) {
  const { t } = useLanguage(); // I18N
  const [editing, setEditing] = useState(false);
  const { pending, run } = usePending<"answered" | "edit" | "delete">();

  // The sheet closes either way: the board says how it went in a banner.
  function finish(action: "answered" | "edit" | "delete", change: () => Promise<boolean>) {
    return run(action, async () => {
      await change();
      onClose();
    });
  }

  return (
    <Sheet title={t(STRINGS.manage)} onClose={onClose}>
      {editing ? (
        <RequestEditor
          body={request.body}
          saving={pending === "edit"}
          onSave={(body) => finish("edit", () => onEdit(body))}
          onCancel={onClose}
        />
      ) : (
        <>
          <Button pending={pending === "answered"} disabled={pending !== null} onClick={() => finish("answered", onAnswered)}>
            {t(STRINGS.markAnswered)}
          </Button>
          <Button variant="quiet" disabled={pending !== null} onClick={() => setEditing(true)}>
            {t(STRINGS.editRequest)}
          </Button>
          <Button variant="danger" pending={pending === "delete"} disabled={pending !== null} onClick={() => finish("delete", onDelete)}>
            {t(STRINGS.deleteRequest)}
          </Button>
          <Button variant="text" onClick={onClose}>
            {t(STRINGS.cancel)}
          </Button>
        </>
      )}
    </Sheet>
  );
}
