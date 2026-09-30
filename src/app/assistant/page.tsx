import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import AssistantChat from "@/features/assistant/components/AssistantChat";
import { getCurrentUser } from "@/features/auth/server/queries"; // AUTH
import { createClient } from "@/lib/supabase/server";

// The assistant keeps no data on the server, so this page loads only who is signed in: the conversation
// is stored on the device, under that user's id, because families here share phones.
export default async function AssistantPage() {
  const user = await getCurrentUser(await createClient()); // AUTH
  if (!user) redirect("/login"); // the proxy already redirects; this also satisfies the types

  return (
    <>
      <PageHeader title="Assistant" />
      <AssistantChat userId={user.id} />
    </>
  );
}
