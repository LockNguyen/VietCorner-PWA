"use client";

import Sheet from "@/components/ui/Sheet";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";
import OptionButtons from "./OptionButtons";

type Props = {
  onAnswered: () => Promise<boolean>;
  onEdit: () => void; // opens the edit screen
  onDelete: () => Promise<boolean>;
  onClose: () => void;
};

// What an author can do with their own request: mark it answered (the one blue button), edit it (its own
// screen), or delete it (a small red line, tapped twice). The sheet's X, or a swipe down, backs out.
export default function RequestOptions({ onAnswered, onEdit, onDelete, onClose }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"answered" | "delete">();

  // The sheet slides away either way: the board says how it went in a banner.
  function finish(action: "answered" | "delete", change: () => Promise<boolean>, close: () => void) {
    return run(action, async () => {
      await change();
      close();
    });
  }

  return (
    <Sheet title={t(STRINGS.manage)} closeLabel={t(COMMON.close)} onClose={onClose}>
      {(close) => (
        <OptionButtons
          pending={pending}
          onAnswered={() => finish("answered", onAnswered, close)}
          onEdit={() => {
            close();
            onEdit();
          }}
          onDelete={() => finish("delete", onDelete, close)}
        />
      )}
    </Sheet>
  );
}
