"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Joining has no side effects, so it writes straight to Supabase. RLS only allows joining as yourself.
export default function JoinButton({ groupId }: { groupId: string }) {
  const router = useRouter();

  async function join() {
    const { error } = await createClient().from("group_members").insert({ group_id: groupId });
    if (error) alert(error.message);
    else router.refresh();
  }

  return (
    <button onClick={join} className="rounded bg-blue-500 px-4 py-1 text-white">
      Join
    </button>
  );
}
