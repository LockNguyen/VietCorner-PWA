"use client";

import PhoneNumber from "@/components/PhoneNumber";
import Avatar from "@/components/ui/Avatar";
import PersonCard from "@/components/ui/PersonCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { STAFF } from "../directory";

// The staff page: for each person, their role as a heading, then a card with their photo, their name and
// their number (a tap offers call, text or copy).
export default function StaffDirectory() {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex flex-col pb-6">
      {STAFF.map((member) => (
        <section key={member.name.en}>
          <SectionHeading variant="large">{t(member.role)}</SectionHeading>
          <div className="px-3">
            <PersonCard picture={<Avatar size="large" src={member.photo ?? undefined} />} name={t(member.name)}>
              {member.phone && <PhoneNumber phone={member.phone} />}
            </PersonCard>
          </div>
        </section>
      ))}
    </div>
  );
}
