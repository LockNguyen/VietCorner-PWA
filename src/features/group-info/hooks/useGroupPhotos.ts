"use client";

import { useEffect, useRef, useState } from "react";
import { addPhoto, getPhotos, removePhoto } from "../api";
import { PHOTO_PAGE_SIZE, type NewPhoto, type Photo } from "../types";

// A group's pictures, newest first, a page at a time: the first page when the group's sheet opens, the
// next when the strip is scrolled to its end. Also adding one and removing one.
// Held here and not loaded by the page: pictures are only wanted once a group is opened.
export function useGroupPhotos(groupId: string) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const loadingMore = useRef(false); // the end marker can come into view twice before the first answer

  // A full page means there may be another; a short one is the last.
  function show(firstPage: Photo[]) {
    setPhotos(firstPage);
    setHasMore(firstPage.length === PHOTO_PAGE_SIZE);
  }

  useEffect(() => {
    let closed = false; // the sheet was closed before the answer came
    getPhotos(groupId)
      .then((page) => !closed && show(page))
      .catch(() => {}); // offline or a hiccup: the sheet shows no pictures, and opening it again retries
    return () => {
      closed = true;
    };
  }, [groupId]);

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
