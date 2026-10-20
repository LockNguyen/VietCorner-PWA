"use client";

import { Globe } from "lucide-react";
import Button from "@/components/ui/Button";
import { useLanguage } from "../hooks/useLanguage";
import { LANGUAGE_NAMES } from "../types";

// The other language as one quiet link, for the sign-in screen, where the full chooser would crowd the form.
export default function LanguageLink() {
  const { language, setLanguage } = useLanguage();
  const other = language === "vi" ? "en" : "vi";

  return (
    <Button variant="text" onClick={() => setLanguage(other)}>
      <span className="inline-flex items-center gap-1.5">
        {/* why: the globe is the sign for "language" that people recognise even in a language they cannot read */}
        <Globe className="size-5" aria-hidden />
        {LANGUAGE_NAMES[other]}
      </span>
    </Button>
  );
}
