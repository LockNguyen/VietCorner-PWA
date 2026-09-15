import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ChatRoom from "@/features/chat/components/ChatRoom";
import { getChatRoom } from "@/features/chat/server/queries";
import { createClient } from "@/lib/supabase/server";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const room = await getChatRoom(await createClient(), groupId);
  if (!room) notFound();

  return (
    <>
      <PageHeader title={room.group.name} />
      <ChatRoom groupId={groupId} myUserId={room.userId} initialMessages={room.messages} />
    </>
  );
}
