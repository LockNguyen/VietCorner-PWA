import { redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import AssistantChat from "@/features/assistant/components/AssistantChat";
import { createClient } from "@/lib/supabase/server";

// The assistant keeps no data on the server, so this page loads only who is signed in: the conversation
// is stored on the device, under that user's id, because families here share phones.
export default async function AssistantPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // the proxy already does this; belt and braces, and it satisfies the types

  return (
    <>
      <PageHeader title="Assistant" />
      <AssistantChat userId={user.id} />
    </>
  );
}
