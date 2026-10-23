"use client";

import { useRef, useState } from "react";
import { useOnArrival } from "@/lib/useOnArrival";
import { addPhoto, getPhotos, removePhoto } from "../api";
import { PHOTO_PAGE_SIZE, type NewPhoto, type Photo } from "../types";

// A group's pictures, newest first, a page at a time: the first page as the page brought it (server/queries.ts),
// read again on arrival and on return to the app like every list (the strip starts over from it), the next when
// the strip is scrolled to its end. Also adding one and removing one.
export function useGroupPhotos(groupId: string, firstPage: Photo[]) {
  const [photos, setPhotos] = useState<Photo[]>(firstPage);
  const [hasMore, setHasMore] = useState(firstPage.length === PHOTO_PAGE_SIZE);
  const loadingMore = useRef(false); // the end marker can come into view twice before the first answer

  // A full page means there may be another; a short one is the last.
  function show(firstPage: Photo[]) {
    setPhotos(firstPage);
    setHasMore(firstPage.length === PHOTO_PAGE_SIZE);
  }

  useOnArrival(() => {
    getPhotos(groupId)
      .then(show)
      .catch(() => {}); // offline or a hiccup: the pictures on screen stay, and the next arrival tries again
  });

  async function loadMore() {
    const oldest = photos.at(-1);
    if (loadingMore.current || !oldest) return;

    loadingMore.current = true;
    try {
      const page = await getPhotos(groupId, oldest.created_at);
      setPhotos((shown) => [...shown, ...page]);
      setHasMore(page.length === PHOTO_PAGE_SIZE);
    } catch {
      // The marker stays, so scrolling to it again tries again.
    } finally {
      loadingMore.current = false;
    }
  }

  // The new picture is the newest, so the strip starts over from its first page.
  async function add(photo: NewPhoto) {
    await addPhoto(groupId, photo);
    show(await getPhotos(groupId));
  }

  async function remove(photoId: string) {
    await removePhoto(groupId, photoId);
    setPhotos((shown) => shown.filter((photo) => photo.id !== photoId));
  }

  return { photos, hasMore, loadMore, add, remove };
}
