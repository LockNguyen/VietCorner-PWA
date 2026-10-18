"use client";

import { Clock, MapPin, Phone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import PhoneNumber from "@/components/PhoneNumber";
import Button from "@/components/ui/Button";
import IconLine from "@/components/ui/IconLine";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { GO_FORWARD } from "@/lib/slide";
import { SWITCHES } from "@/lib/switches";
import { locationText, nameText } from "../bilingual";
import { formatMeeting } from "../meeting";
import { STRINGS } from "../strings";
import { GROUP_THUMBNAIL_BUCKET, type DirectoryGroup } from "../types";
import GroupPhotos from "./GroupPhotos";

type Props = {
  group: DirectoryGroup;
  canManage: boolean; // an admin: an Edit button at the bottom, opening the group's editor
};

// One group, as its own screen sliding in from the right, shaped exactly like an event's page (the user,
// 2026-10-17): a big picture, then a few facts with icons (when, where while `groupLocation` is on, whom to
// call), the notes, and the group's pictures. Kept short: elderly members read it at a glance.
export default function GroupPage({ group, canManage }: Props) {
  const { t, language } = useLanguage(); // I18N
  const router = useRouter();
  const when = formatMeeting(group.meets_weekday, group.meets_time, language) ?? group.meets_at;
  const where = SWITCHES.groupLocation ? t(locationText(group)) : "";
  const picture = group.thumbnail_path ? publicFileUrl(GROUP_THUMBNAIL_BUCKET, group.thumbnail_path) : undefined;

  return (
    <div className="flex flex-col gap-5 px-3 pt-3 pb-6">
      <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-control bg-fill text-subtle">
        {picture ? <img src={picture} alt="" className="size-full object-cover" /> : <Users className="size-12" />}
      </div>

      <div className="flex flex-col gap-4">
        {when && (
          <IconLine icon={<Clock />} label={t(STRINGS.when)}>
            {when}
          </IconLine>
        )}
        {where && (
          <IconLine icon={<MapPin />} label={t(STRINGS.where)}>
            {where}
          </IconLine>
        )}
        {group.contact_phone && (
          <IconLine icon={<Phone />} label={t(STRINGS.contact)}>
            <PhoneNumber phone={group.contact_phone} />
          </IconLine>
        )}
      </div>

      {group.notes && (
        <div className="whitespace-pre-wrap">
          <Text>{group.notes}</Text>
        </div>
      )}

      <GroupPhotos groupId={group.id} groupName={t(nameText(group))} canAdd={group.is_member} canRemove={false} />

      {canManage && (
        <Button variant="quiet" onClick={() => router.push(`/groups/manage/${group.id}`, { transitionTypes: GO_FORWARD })}>
          {t(STRINGS.editGroup)}
        </Button>
      )}
    </div>
  );
}
