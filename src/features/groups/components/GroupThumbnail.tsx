"use client";

import { Users } from "lucide-react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Spinner from "@/components/ui/Spinner";
import TextInput from "@/components/ui/TextInput";
import Thumbnail from "@/components/ui/Thumbnail";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { useSave } from "@/lib/useSave";
import { removeThumbnail, setThumbnail } from "../api";
import { STRINGS } from "../strings";
import { THUMBNAIL_BUCKET, type Group } from "../types";

// The small picture that starts this group's row: as it is now, a box that chooses one (or another, which
// replaces it), and a button that removes it. Choosing saves at once.
export default function GroupThumbnail({ group }: { group: Group }) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"set" | "remove">();
  const path = group.thumbnail_path;
  const failed = t(COMMON.couldNotSave);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Thumbnail src={path ? publicFileUrl(THUMBNAIL_BUCKET, path) : undefined}>
          <Users />
        </Thumbnail>
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
            if (file) save("set", () => setThumbnail(group.id, file, path), { done: t(COMMON.saved), failed });
          }}
        />
      </Field>
      {path && (
        <Button
          variant="quiet"
          pending={pending === "remove"}
          disabled={pending !== null}
          onClick={() => save("remove", () => removeThumbnail(group.id, path), { done: t(COMMON.removed), failed })}
        >
          {t(STRINGS.removePicture)}
        </Button>
      )}
    </div>
  );
}
