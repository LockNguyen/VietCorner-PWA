"use client";

import PhoneNumber from "@/components/PhoneNumber";
import Avatar from "@/components/ui/Avatar";
import PersonCard from "@/components/ui/PersonCard";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STAFF } from "../directory";

// The staff page: a contact card per person: their photo, their name in bold, their role, and their number
// (a tap opens the call / text / copy menu). The role moved from a heading into the card (the user, 2026-10-19).
export default function StaffDirectory() {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex flex-col gap-3 px-3 pt-4 pb-6">
      {STAFF.map((member) => (
        <PersonCard
          key={member.name.en}
          picture={<Avatar size="large" src={member.photo ?? undefined} />}
          name={t(member.name)}
          subtitle={t(member.role)}
        >
          {member.phone && <PhoneNumber phone={member.phone} />}
        </PersonCard>
      ))}
    </div>
  );
}
