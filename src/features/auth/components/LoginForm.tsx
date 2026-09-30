"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendLoginCode, verifyLoginCode } from "../api";
import { STRINGS } from "../strings";

// Two steps: 1) enter email → a code is emailed. 2) type the code → signed in.
// Why a typed code instead of a clicked link: on iPhone, email links open in Safari,
// which does not share its login with the app installed on the Home Screen.
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await sendLoginCode(email);
      setCodeSent(true);
    } catch (error) {
      setError((error as Error).message);
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await verifyLoginCode(email, code);
      router.replace("/groups");
      router.refresh(); // re-run the proxy so it sees the new login cookie
    } catch (error) {
      setError((error as Error).message);
    }
  }

  const inputClass = "w-full rounded border p-3 text-lg";
  const buttonClass = "w-full rounded bg-blue-500 p-3 text-lg text-white";

  return (
    <div className="space-y-4 p-4">
      {!codeSent ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <label className="block text-lg">{STRINGS.emailLabel}</label>
          <input type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          <button className={buttonClass}>{STRINGS.sendCodeButton}</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <label className="block text-lg">{STRINGS.codeSentTo(email)}</label>
          <input inputMode="numeric" required autoComplete="one-time-code" value={code}
            onChange={(e) => setCode(e.target.value.trim())} className={inputClass} />
          <button className={buttonClass}>{STRINGS.signInButton}</button>
          <button type="button" onClick={() => setCodeSent(false)} className="w-full p-2 text-blue-500">
            {STRINGS.useAnotherEmail}
          </button>
        </form>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
