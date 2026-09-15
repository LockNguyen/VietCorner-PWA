import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";
import type { Message } from "../types";
import ChatRoom from "./ChatRoom";

// Loads a group and its latest messages on the server, then hands off to the live ChatRoom.
export default async function GroupChat({ groupId }: { groupId: string }) {
  const supabase = await createClient();
  const [{ data: group }, { data: messages }, { data: { user } }] = await Promise.all([
    supabase.from("groups").select("id, name").eq("id", groupId).single(),
    supabase.from("messages").select("*").eq("group_id", groupId)
      .order("created_at", { ascending: false }).limit(50), // newest 50, reversed below
    supabase.auth.getUser(),
  ]);

  if (!group) notFound();

  return (
    <>
      <PageHeader title={group.name} />
      <ChatRoom
        groupId={groupId}
        myUserId={user?.id ?? ""}
        initialMessages={((messages ?? []) as Message[]).reverse()}
      />
    </>
  );
}
