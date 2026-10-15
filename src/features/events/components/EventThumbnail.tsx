"use client";

import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import SectionHeading from "@/components/ui/SectionHeading";
import Spinner from "@/components/ui/Spinner";
import TextInput from "@/components/ui/TextInput";
import Thumbnail from "@/components/ui/Thumbnail";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";
import { THUMBNAIL_BUCKET, type ManagedEvent } from "../types";

type Props = {
  event: ManagedEvent;
  onSet: (file: Blob, replaces: string | null) => Promise<void>;
  onRemove: (path: string) => Promise<void>;
};

// The small picture that starts this event's row on the schedule: as it is now, a box that chooses one
// (or another, which replaces it), and a button that removes it. Choosing saves at once, like a reminder switch.
export default function EventThumbnail({ event, onSet, onRemove }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, run } = usePending<"set" | "remove">();
  const path = event.thumbnail_path;

  return (
    <section>
      <SectionHeading>{t(STRINGS.pictureHeading)}</SectionHeading>
      <div className="flex flex-col gap-3 px-3">
        <div className="flex items-center gap-3">
          <Thumbnail src={path ? publicFileUrl(THUMBNAIL_BUCKET, path) : undefined} />
          {pending === "set" && <Spinner />}
        </div>
        <Field label={t(path ? STRINGS.changePicture : STRINGS.choosePicture)}>
          <TextInput
            type="file"
            accept="image/*"
            disabled={pending !== null}
            onChange={(change) => {
              const file = change.target.files?.[0];
              change.target.value = ""; // so choosing the same file again is still a change
              if (file) run("set", () => onSet(file, path));
            }}
          />
        </Field>
        {path && (
          <Button variant="quiet" pending={pending === "remove"} disabled={pending !== null} onClick={() => run("remove", () => onRemove(path))}>
            {t(STRINGS.removePicture)}
          </Button>
        )}
      </div>
    </section>
  );
}
