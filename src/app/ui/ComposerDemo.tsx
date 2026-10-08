"use client";

import { useState } from "react";
import Composer from "@/components/ui/Composer";

// A real composer, held above this page's tab bar as it is on a chat screen.
export default function ComposerDemo() {
  const [draft, setDraft] = useState("");

  return (
    <Composer
      value={draft}
      onChange={setDraft}
      onSend={() => setDraft("")}
      placeholder="Tin nhắn"
      sendLabel="Gửi"
      disabled={draft.trim() === ""}
    />
  );
}
