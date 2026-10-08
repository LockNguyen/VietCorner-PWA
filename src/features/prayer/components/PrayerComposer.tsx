"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import Switch from "@/components/ui/Switch";
import TextArea from "@/components/ui/TextArea";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";
import { MAX_BODY_LENGTH, type NewPrayerRequest, type PostableGroup } from "../types";

type Props = {
  groups: PostableGroup[]; // never empty: the board shows a "join a group" message instead
  onPost: (request: NewPrayerRequest) => Promise<boolean>;
};

// Writing a request: the words, which group hears them, and whether my name is shown.
export default function PrayerComposer({ groups, onPost }: Props) {
  const { t } = useLanguage(); // I18N
  const [body, setBody] = useState("");
  const [groupId, setGroupId] = useState(groups[0].id);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { pending, run } = usePending<"post">();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run("post", async () => {
      const posted = await onPost({ groupId, body: body.trim(), isAnonymous });
      // Only a request that was saved clears the form: after a failure the words are still there to resend.
      if (posted) {
        setBody("");
        setIsAnonymous(false);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 pt-4">
      <Field label={t(STRINGS.bodyPlaceholder)}>
        <TextArea value={body} onChange={(event) => setBody(event.target.value)} maxLength={MAX_BODY_LENGTH} rows={3} />
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
    </form>
  );
}
