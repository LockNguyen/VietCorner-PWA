"use client";

import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import ImageCropper from "@/components/ui/ImageCropper";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { useAvatarChange } from "../hooks/useAvatarChange";
import { STRINGS } from "../strings";
import { AVATAR_BUCKET } from "../types";

type Props = { userId: string; avatarPath: string | null };

// The picture screen of Settings: my picture as others see it, and a way to choose one. A chosen picture is framed in a
// circle first (drag, pinch), and only "Use this picture" saves it.
export default function AvatarSection({ userId, avatarPath }: Props) {
  const { t } = useLanguage(); // I18N
  const change = useAvatarChange(userId, avatarPath);

  return (
    <section>
      {change.chosenUrl ? (
        <div className="flex flex-col gap-3 px-3 pt-4">
          <ImageCropper
            src={change.chosenUrl}
            position={change.position}
            zoom={change.zoom}
            onPositionChange={change.setPosition}
            onZoomChange={change.setZoom}
            onCropped={change.setArea}
          />
          <Text variant="small" tone="subtle">{t(STRINGS.cropHint)}</Text>
          <Button pending={change.pending === "use"} onClick={change.use}>
            {t(STRINGS.usePicture)}
          </Button>
          <Button variant="text" disabled={change.pending !== null} onClick={change.cancel}>
            {t(STRINGS.cancel)}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-3 pt-4">
          <Avatar size="large" src={avatarPath ? publicFileUrl(AVATAR_BUCKET, avatarPath) : undefined} />
          <Field label={t(avatarPath ? STRINGS.changePicture : STRINGS.choosePicture)}>
            <TextInput
              type="file"
              accept="image/*"
              disabled={change.pending !== null}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = ""; // so choosing the same file again is still a change
                if (file) change.choose(file);
              }}
            />
          </Field>
          {avatarPath && (
            <Button variant="dangerText" pending={change.pending === "remove"} disabled={change.pending !== null} onClick={change.remove}>
              {t(STRINGS.removePicture)}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
