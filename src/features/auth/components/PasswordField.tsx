"use client";

import { useState } from "react";
import Field from "@/components/ui/Field";
import PasswordInput from "@/components/ui/PasswordInput";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

type Props = {
  label?: string; // shown above; without one (sign-in) the field carries `placeholder` inside instead
  placeholder?: string;
  // Tells the password manager what to do: fill a saved password, or offer to save a new one.
  autoComplete: "current-password" | "new-password";
  value: string;
  onChange: (value: string) => void;
};

// why: Supabase's own minimum (Authentication → Providers → Email). Checked here only to say so sooner.
const MIN_LENGTH = 6;

// A password with an eye to show what was typed: typing blind on a small keyboard is hard for many members.
export default function PasswordField({ label, placeholder, autoComplete, value, onChange }: Props) {
  const { t } = useLanguage(); // I18N
  const [shown, setShown] = useState(false);

  const input = (
    <PasswordInput
      name="password"
      required
      minLength={MIN_LENGTH}
      autoComplete={autoComplete}
      placeholder={placeholder}
      aria-label={label ? undefined : placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      shown={shown}
      onToggle={() => setShown(!shown)}
      toggleLabel={t(shown ? STRINGS.hidePassword : STRINGS.showPassword)}
    />
  );
  return label ? <Field label={label}>{input}</Field> : input;
}
