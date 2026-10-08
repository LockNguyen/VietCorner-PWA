import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ChatRoom from "@/features/chat/components/ChatRoom"; // CHAT
import { getChatRoom } from "@/features/chat/server/queries"; // CHAT
import { getGroup } from "@/features/groups/server/queries";
import { createClient } from "@/lib/supabase/server";

// A group's page is its chat. The group itself comes from `groups`, the conversation from `chat`.
export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createClient();
  const [group, room] = await Promise.all([getGroup(supabase, groupId), getChatRoom(supabase, groupId)]);
  if (!group) notFound();

  return (
    <>
      <PageHeader title={group.name} backHref="/groups" />
      <ChatRoom groupId={groupId} myUserId={room.userId} initialMessages={room.messages} />
    </>
  );
}
