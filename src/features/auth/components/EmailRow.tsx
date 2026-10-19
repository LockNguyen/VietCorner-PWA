"use client";

import { Mail } from "lucide-react";
import ListRow from "@/components/ui/ListRow";
import RoundIcon from "@/components/ui/RoundIcon";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";

// The Settings row showing which email is signed in. Only to read: the email's link signs in, so there is
// nothing to change.
export default function EmailRow({ email }: { email: string }) {
  const { t } = useLanguage(); // I18N

  return <ListRow leading={<RoundIcon tone="subtle" size="small"><Mail /></RoundIcon>} title={t(STRINGS.emailLabel)} subtitle={email} />;
}
