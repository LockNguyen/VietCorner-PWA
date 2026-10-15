"use client";

import { useState } from "react";
import Sheet from "@/components/ui/Sheet";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";
import type { PrayerRequest } from "../types";
import OptionButtons from "./OptionButtons";
import RequestEditor from "./RequestEditor";
import { COMMON } from "@/features/i18n/common"; // I18N

type Props = {
  request: PrayerRequest;
  onAnswered: () => Promise<boolean>;
  onEdit: (body: string) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
  onClose: () => void;
};

// What an author can do with their own request: mark it answered (the one blue button), edit it, or delete
// it (a small red line, tapped twice). The sheet's X, or a swipe down, backs out.
export default function RequestOptions({ request, onAnswered, onEdit, onDelete, onClose }: Props) {
  const { t } = useLanguage(); // I18N
  const [editing, setEditing] = useState(false);
  const { pending, run } = usePending<"answered" | "edit" | "delete">();

  // The sheet slides away either way: the board says how it went in a banner.
  function finish(action: "answered" | "edit" | "delete", change: () => Promise<boolean>, close: () => void) {
    return run(action, async () => {
      await change();
      close();
    });
  }

  return (
    <Sheet title={t(STRINGS.manage)} closeLabel={t(COMMON.close)} onClose={onClose}>
      {(close) =>
        editing ? (
          <RequestEditor
            body={request.body}
            saving={pending === "edit"}
            onSave={(body) => finish("edit", () => onEdit(body), close)}
            onCancel={close}
          />
        ) : (
          <OptionButtons
            pending={pending}
            onAnswered={() => finish("answered", onAnswered, close)}
            onEdit={() => setEditing(true)}
            onDelete={() => finish("delete", onDelete, close)}
          />
        )
      }
    </Sheet>
  );
}
