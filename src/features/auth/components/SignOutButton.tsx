"use client";

import { useRouter } from "next/navigation";
import { signOut } from "../api";

export default function SignOutButton() {
  const router = useRouter();

  async function handleClick() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button onClick={handleClick} className="rounded border p-3 text-red-600">
      Sign out
    </button>
  );
}
