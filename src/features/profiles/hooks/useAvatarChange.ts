"use client";

import { useRef, useState } from "react";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { cropToSquare, type CropArea } from "@/lib/cropImage";
import { useSave } from "@/lib/useSave";
import { removeAvatar, setAvatar } from "../api";
import { AVATAR_SIDE } from "../types";

// Choosing my picture: a file is chosen, framed in the cropper (`position`, `zoom`, the area it reports),
// then cropped, saved and shown, or put aside with Cancel. Also taking the picture away.
export function useAvatarChange(userId: string, current: string | null) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<"use" | "remove">();
  const [chosen, setChosen] = useState<{ file: File; url: string } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  // A ref: the cropper reports it after every move, and nothing on screen depends on it.
  const area = useRef<CropArea | null>(null);
  const says = { done: t(COMMON.saved), failed: t(COMMON.couldNotSave) };

  function choose(file: File) {
    setChosen({ file, url: URL.createObjectURL(file) });
    setPosition({ x: 0, y: 0 });
    setZoom(1);
  }

  function cancel() {
    if (chosen) URL.revokeObjectURL(chosen.url); // the browser holds the file until told to let go
    setChosen(null);
  }

  async function use() {
    const framed = area.current;
    if (!chosen || !framed) return;
    const saved = await save("use", async () => setAvatar(userId, await cropToSquare(chosen.file, framed, AVATAR_SIDE), current), says);
    if (saved) cancel();
  }

  function remove() {
    if (current) save("remove", () => removeAvatar(current), { ...says, done: t(COMMON.removed) });
  }

  return {
    pending,
    chosenUrl: chosen?.url ?? null,
    position,
    zoom,
    setPosition,
    setZoom,
    setArea: (framed: CropArea) => (area.current = framed),
    choose,
    cancel,
    use,
    remove,
  };
}
