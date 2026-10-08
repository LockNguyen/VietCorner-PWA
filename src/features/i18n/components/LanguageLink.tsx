"use client";

import Button from "@/components/ui/Button";
import { useLanguage } from "../hooks/useLanguage";
import { LANGUAGE_NAMES } from "../types";

// The other language as one quiet link, for the sign-in screen, where the full chooser would crowd the form.
export default function LanguageLink() {
  const { language, setLanguage } = useLanguage();
  const other = language === "vi" ? "en" : "vi";

  return (
    <Button variant="text" onClick={() => setLanguage(other)}>
      {LANGUAGE_NAMES[other]}
    </Button>
  );
}
