"use client";

import SectionHeading from "@/components/ui/SectionHeading";
import Switch from "@/components/ui/Switch";
import { COMMON } from "@/features/i18n/common"; // I18N
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useSave } from "@/lib/useSave";
import { setRole } from "../api";
import { STRINGS } from "../strings";
import { ROLES } from "../types";

type Props = { userId: string; roles: string[]; isMe: boolean };

// What one person may do: a switch per role. Each switch saves at once. An admin cannot switch off their
// own "admin" (the database refuses it too): the church must keep someone who can open this screen.
export default function PersonRoles({ userId, roles, isMe }: Props) {
  const { t } = useLanguage(); // I18N
  const { pending, save } = useSave<string>();
  const says = { done: t(COMMON.saved), failed: t(COMMON.couldNotSave) };

  return (
    <section className="flex flex-col">
      <SectionHeading>{t(STRINGS.rolesHeading)}</SectionHeading>
      <div className="flex flex-col px-3">
        {ROLES.map(({ role, label }) => (
          <Switch
            key={role}
            label={t(label)}
            checked={roles.includes(role)}
            disabled={pending !== null || (isMe && role === "admin")}
            onChange={(event) => {
              const given = event.target.checked; // read now: the event object is reused after this handler
              save(role, () => setRole(userId, role, given), says);
            }}
          />
        ))}
      </div>
    </section>
  );
}
