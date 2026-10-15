"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { createGroup } from "../api";
import { STRINGS } from "../strings";
import { MAX_GROUP_NAME_LENGTH } from "../types";

// A new group: its name, then Create, which opens the new group's editor for everything else.
export default function NewGroupForm() {
  const { t } = useLanguage(); // I18N
  const router = useRouter();
  const showBanner = useBanner();
  const [name, setName] = useState("");
  const { pending, run } = usePending<"create">();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run("create", async () => {
      try {
        router.replace(`/groups/manage/${await createGroup(name.trim())}`);
      } catch {
        showBanner({ kind: "error", message: t(COMMON.couldNotSave) });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-3 pt-4">
      <TextInput
        autoFocus
        placeholder={t(STRINGS.groupName)}
        aria-label={t(STRINGS.groupName)}
        maxLength={MAX_GROUP_NAME_LENGTH}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Button pending={pending === "create"} disabled={name.trim() === ""}>
        {t(STRINGS.createGroup)}
      </Button>
    </form>
  );
}
