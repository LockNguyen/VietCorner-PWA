import Picture from "./Picture";

// The logo: the app's own icon file, so replacing that file replaces both. The icons are made from
// public/icons/logo-source.webp (the user's "VC" over the Earth, 2026-10-14).
export default function LogoMark() {
  return <Picture src="/icons/icon-192.png" className="size-24 rounded-control" />;
}
