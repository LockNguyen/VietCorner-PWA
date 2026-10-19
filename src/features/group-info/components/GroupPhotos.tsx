"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Lightbox from "@/components/ui/Lightbox";
import PhotoAddTile from "@/components/ui/PhotoAddTile";
import PhotoStrip from "@/components/ui/PhotoStrip";
import PhotoThumb from "@/components/ui/PhotoThumb";
import Text from "@/components/ui/Text";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import { useBanner } from "@/lib/useBanner";
import { useSave } from "@/lib/useSave";
import { useGroupPhotos } from "../hooks/useGroupPhotos";
import { savePhoto } from "../savePhoto";
import { STRINGS } from "../strings";
import type { Photo } from "../types";
import AddPhotoForm from "./AddPhotoForm";
import PhotoStripEnd from "./PhotoStripEnd";

type Props = {
  groupId: string;
  groupName: string;
  canAdd: boolean; // in the group, or a group manager
  canRemove: boolean; // a group manager
};

// A group's pictures inside its sheet: a strip that scrolls sideways and loads more at its end, the large
// view a tap opens (with saving a picture to the phone), adding a picture (the group's people and managers: a +
// square first in the strip, the user 2026-10-19) and removing one (managers).
// Nothing at all for a reader of a group that has no pictures.
export default function GroupPhotos({ groupId, groupName, canAdd, canRemove }: Props) {
  const { t, language } = useLanguage(); // I18N
  const { photos, hasMore, loadMore, add, remove } = useGroupPhotos(groupId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { pending, save } = useSave<"remove">();
  const showBanner = useBanner();

  // Found again on every render, so the large view closes by itself when its picture is removed.
  const index = photos.findIndex((photo) => photo.id === openId);
  const open = photos[index] as Photo | undefined;
  const altFor = (photo: Photo) => photo.caption ?? `${t(STRINGS.photoOf)} ${groupName}`;
  // "12 October 2026 · Picnic at the lake": whichever of the two the picture has.
  const captionFor = (photo: Photo) =>
    [
      // Noon, so the calendar date is the same day in every timezone.
      photo.taken_on && new Date(`${photo.taken_on}T12:00:00`).toLocaleDateString(LOCALES[language], { dateStyle: "long" }),
      photo.caption,
    ]
      .filter(Boolean)
      .join(" · ");

  if (photos.length === 0 && !canAdd) return null;

  return (
    <div className="flex flex-col gap-3">
      <Text variant="small" tone="subtle">{t(STRINGS.photos)}</Text>

      <PhotoStrip>
        {canAdd && <PhotoAddTile label={t(STRINGS.addPhoto)} onClick={() => setAdding(true)} />}
        {photos.map((photo) => (
          <PhotoThumb key={photo.id} src={photo.smallUrl} alt={altFor(photo)} onClick={() => setOpenId(photo.id)} />
        ))}
        {hasMore && <PhotoStripEnd onReached={loadMore} loadedSoFar={photos.length} />}
      </PhotoStrip>

      {adding && <AddPhotoForm onAdd={add} onDone={() => setAdding(false)} />}

      {open && (
        <Lightbox
          src={open.fullUrl}
          alt={altFor(open)}
          caption={captionFor(open)}
          labels={{
            previous: t(STRINGS.previousPhoto),
            next: t(STRINGS.nextPhoto),
            close: t(COMMON.close),
            download: t(STRINGS.savePhoto),
          }}
          onDownload={() =>
            savePhoto(open.fullUrl, `${groupName} ${open.taken_on ?? open.id}.jpg`).catch(() =>
              showBanner({ kind: "error", message: t(STRINGS.couldNotSavePhoto) }),
            )
          }
          onPrevious={index > 0 ? () => setOpenId(photos[index - 1].id) : undefined}
          onNext={index < photos.length - 1 ? () => setOpenId(photos[index + 1].id) : undefined}
          onClose={() => setOpenId(null)}
        >
          {/* No "are you sure?" (decided for the whole app: fewer taps). The picture is erased for good. */}
          {canRemove && (
            <Button
              variant="danger"
              pending={pending === "remove"}
              onClick={() => save("remove", () => remove(open.id), { done: t(COMMON.removed), failed: t(COMMON.couldNotSave) })}
            >
              {t(STRINGS.removePhoto)}
            </Button>
          )}
        </Lightbox>
      )}
    </div>
  );
}
