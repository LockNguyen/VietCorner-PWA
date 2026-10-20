"use client";

import { createContext, useContext } from "react";

// The signed-in person's own picture, for the top bar's Settings button (PageHeader). The root layout reads it
// once per page load and puts it here, so the twenty-odd pages that draw a PageHeader need not each read it.
// Undefined: signed out, or no picture chosen (the default figure is drawn).
const MyPictureContext = createContext<string | undefined>(undefined);

export function MyPictureProvider({ src, children }: { src: string | undefined; children: React.ReactNode }) {
  return <MyPictureContext value={src}>{children}</MyPictureContext>;
}

export function useMyPicture(): string | undefined {
  return useContext(MyPictureContext);
}
