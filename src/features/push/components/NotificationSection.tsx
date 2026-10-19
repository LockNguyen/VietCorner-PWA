"use client";

import { Bell } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STRINGS } from "../strings";
import NotificationSwitch from "./NotificationSwitch";

// The notifications switch under its heading, for a screen that shows other things too (waiting for approval).
export default function NotificationSection() {
  const { t } = useLanguage(); // I18N

  return (
    <section>
      <SectionHeading variant="large" icon={<Bell />}>{t(STRINGS.heading)}</SectionHeading>
      <NotificationSwitch />
    </section>
  );
}
