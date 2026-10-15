"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Sheet from "@/components/ui/Sheet";
import Switch from "@/components/ui/Switch";
import TextArea from "@/components/ui/TextArea";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";
import { MAX_BODY_LENGTH, type NewPrayerRequest } from "../types";
import { COMMON } from "@/features/i18n/common"; // I18N

type Props = {
  onPost: (request: NewPrayerRequest) => Promise<boolean>;
  onClose: () => void;
};

// Writing a request, in a sheet over the list: the words, and whether my name is shown.
// Every request is shared with the whole church.
export default function PrayerComposer({ onPost, onClose }: Props) {
  const { t } = useLanguage(); // I18N
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { pending, run } = usePending<"post">();

  // Only a request that was saved closes the sheet: after a failure the words are still there to resend.
  function submit(event: FormEvent, close: () => void) {
    event.preventDefault();
    run("post", async () => {
      if (await onPost({ body: body.trim(), isAnonymous })) close();
    });
  }

  return (
    <Sheet title={t(STRINGS.addRequest)} closeLabel={t(COMMON.close)} onClose={onClose}>
      {(close) => (
        <form onSubmit={(event) => submit(event, close)} className="flex flex-col gap-3">
          <TextArea
            placeholder={t(STRINGS.bodyPlaceholder)}
            aria-label={t(STRINGS.bodyPlaceholder)}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={MAX_BODY_LENGTH}
            rows={4}
            autoFocus
          />

          <Switch
            label={t(STRINGS.postAnonymously)}
            checked={isAnonymous}
            onChange={(event) => setIsAnonymous(event.target.checked)}
          />

          <Button pending={pending === "post"} disabled={body.trim() === ""}>
            {t(STRINGS.postButton)}
          </Button>
        </form>
      )}
    </Sheet>
  );
}
