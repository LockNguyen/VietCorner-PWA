"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
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
  const [posting, setPosting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setPosting(true);
    const posted = await onPost({ groupId, body: body.trim(), isAnonymous });
    setPosting(false);
    // Only a request that was saved clears the form: after a failure the words are still there to resend.
    if (posted) {
      setBody("");
      setIsAnonymous(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded border p-3">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t(STRINGS.bodyPlaceholder)}
        maxLength={MAX_BODY_LENGTH}
        rows={3}
        className="w-full rounded border p-2 text-lg"
      />

      <label className="mt-2 flex items-center gap-2 text-lg">
        {t(STRINGS.shareWith)}
        {/* With one group there is nothing to choose, so the choice is shown rather than asked. */}
        {groups.length === 1 ? (
          <strong>{groups[0].name}</strong>
        ) : (
          <select
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            className="flex-1 rounded border p-2"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        )}
      </label>

      <label className="mt-2 flex items-center gap-2 text-lg">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
          className="h-5 w-5"
        />
        {t(STRINGS.postAnonymously)}
      </label>

      <button
        disabled={posting || body.trim() === ""}
        className="mt-3 w-full rounded bg-blue-500 p-3 text-lg text-white disabled:opacity-50"
      >
        {t(STRINGS.postButton)}
      </button>
    </form>
  );
}
