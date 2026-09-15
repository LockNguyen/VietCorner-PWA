"use client";

import { useRouter } from "next/navigation";
import { joinGroup } from "../api";

export default function JoinButton({ groupId }: { groupId: string }) {
  const router = useRouter();

  async function handleClick() {
    try {
      await joinGroup(groupId);
      router.refresh(); // reload the page's server data so the group turns into a link
    } catch (error) {
      alert((error as Error).message);
    }
  }

  return (
    <button onClick={handleClick} className="rounded bg-blue-500 px-4 py-1 text-white">
      Join
    </button>
  );
}
