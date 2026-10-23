"use client";

import PhoneNumber from "@/components/PhoneNumber";
import Avatar from "@/components/ui/Avatar";
import PersonCard from "@/components/ui/PersonCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import type { StaffSection } from "../types";
import { useFresh } from "@/lib/useFresh";
import { getStaffSections } from "../api";

// The staff page: for each heading ("Ban điều hành"), a contact card per person under it: their photo, their
// name in bold, their role, and their number (a tap opens the call / text / copy menu).
export default function StaffDirectory({ sections: loaded }: { sections: StaffSection[] }) {
  const sections = useFresh(loaded, getStaffSections); // the kept copy at once, then a fresh read on arrival
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex flex-col pb-6">
      {sections.map((section) => (
        <section key={section.id}>
          <SectionHeading variant="large">{t(section.heading)}</SectionHeading>
          <div className="flex flex-col gap-3 px-3">
            {section.members.map((member) => (
              <PersonCard
                key={member.id}
                picture={<Avatar size="large" src={member.photo ?? undefined} />}
                name={t(member.name)}
                subtitle={t(member.role)}
              >
                {member.phone && <PhoneNumber phone={member.phone} />}
              </PersonCard>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
