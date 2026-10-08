"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Sheet from "@/components/ui/Sheet";
import Switch from "@/components/ui/Switch";
import TextArea from "@/components/ui/TextArea";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";
import { MAX_BODY_LENGTH, type NewPrayerRequest, type PostableGroup } from "../types";

type Props = {
  groups: PostableGroup[]; // never empty: the board shows a "join a group" message instead
  onPost: (request: NewPrayerRequest) => Promise<boolean>;
  onClose: () => void;
};

// Writing a request, in a sheet over the list: the words, which group hears them, whether my name is shown.
export default function PrayerComposer({ groups, onPost, onClose }: Props) {
  const { t } = useLanguage(); // I18N
  const [body, setBody] = useState("");
  const [groupId, setGroupId] = useState(groups[0].id);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { pending, run } = usePending<"post">();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run("post", async () => {
      // Only a request that was saved closes the sheet: after a failure the words are still there to resend.
      if (await onPost({ groupId, body: body.trim(), isAnonymous })) onClose();
    });
  }

  return (
    <Sheet title={t(STRINGS.addRequest)} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label={t(STRINGS.bodyPlaceholder)}>
          <TextArea value={body} onChange={(event) => setBody(event.target.value)} maxLength={MAX_BODY_LENGTH} rows={4} autoFocus />
        </Field>

        {/* With one group there is nothing to choose, so the question is not asked. */}
        {groups.length > 1 && (
          <Field label={t(STRINGS.shareWith)}>
            <Select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Switch label={t(STRINGS.postAnonymously)} checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />

        <Button pending={pending === "post"} disabled={body.trim() === ""}>
          {groups.length > 1 ? t(STRINGS.postButton) : `${t(STRINGS.shareWith)} ${groups[0].name}`}
        </Button>
        <Button type="button" variant="text" onClick={onClose}>
          {t(STRINGS.cancel)}
        </Button>
      </form>
    </Sheet>
  );
}
