"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Switch from "@/components/ui/Switch";
import TextArea from "@/components/ui/TextArea";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { useRequestWriting } from "../hooks/useRequestWriting";
import { STRINGS } from "../strings";
import { MAX_BODY_LENGTH } from "../types";

// Writing a request, on its own screen: the words at the top, whether my name is shown, and Share.
// A screen and not a sheet: a sheet pinned to the bottom was pushed off the top by the iPhone's keyboard
// (2026-10-19); a field at the top of a plain page is one the keyboard never covers.
export default function PrayerComposer() {
  const { t } = useLanguage(); // I18N
  const writing = useRequestWriting();
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { pending, run } = usePending<"post">();

  function submit(event: FormEvent) {
    event.preventDefault();
    run("post", () => writing.post({ body: body.trim(), isAnonymous }));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-3">
      <TextArea
        placeholder={t(STRINGS.bodyPlaceholder)}
        aria-label={t(STRINGS.bodyPlaceholder)}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={MAX_BODY_LENGTH}
        rows={5}
        autoFocus
      />

      <Switch label={t(STRINGS.postAnonymously)} checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />

      <Button pending={pending === "post"} disabled={body.trim() === ""}>
        {t(STRINGS.postButton)}
      </Button>
    </form>
  );
}
