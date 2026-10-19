"use client";

import Avatar from "@/components/ui/Avatar";
import AvatarLink from "@/components/ui/AvatarLink";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { publicFileUrl } from "@/lib/publicFileUrl";
import { STRINGS } from "../strings";
import { AVATAR_BUCKET } from "../types";

type Props = { name: string; avatarPath: string | null };

// The top of Settings: my picture, large, with a camera that opens the picture screen, and my name in bold.
export default function ProfileHeader({ name, avatarPath }: Props) {
  const { t } = useLanguage(); // I18N

  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      <AvatarLink href="/settings/photo" label={t(STRINGS.pictureHeading)}>
        <Avatar size="large" src={avatarPath ? publicFileUrl(AVATAR_BUCKET, avatarPath) : undefined} />
      </AvatarLink>
      <Text as="h2" variant="tile">{name}</Text>
    </div>
  );
}
