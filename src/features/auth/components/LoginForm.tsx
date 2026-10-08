"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/ui/ActionButton";
import { sendLoginCode, verifyLoginCode } from "../api";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { usePending } from "@/lib/usePending";
import { STRINGS } from "../strings";

// Two steps: 1) enter email → a code is emailed. 2) type the code → signed in.
// Why a typed code instead of a clicked link: on iPhone, email links open in Safari,
// which does not share its login with the app installed on the Home Screen.
export default function LoginForm() {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  // One request at a time: a second tap on "Send me a code" used to email a second, different code.
  const { pending, run } = usePending<"send" | "verify">();

  function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    run("send", async () => {
      setError("");
      try {
        await sendLoginCode(email);
        setCodeSent(true);
      } catch (error) {
        setError((error as Error).message);
      }
    });
  }

  function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    run("verify", async () => {
      setError("");
      try {
        await verifyLoginCode(email, code);
        router.replace("/");
        router.refresh(); // re-run the proxy so it sees the new login cookie
      } catch (error) {
        setError((error as Error).message);
      }
    });
  }

  const inputClass = "w-full rounded border p-3 text-lg";
  const buttonClass = "w-full rounded bg-blue-500 p-3 text-lg text-white";

  return (
    <div className="space-y-4 p-4">
      {!codeSent ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <label className="block text-lg">{t(STRINGS.emailLabel)}</label>
          <input type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          <ActionButton pending={pending === "send"} pendingLabel={t(STRINGS.sendingCode)} className={buttonClass}>
            {t(STRINGS.sendCodeButton)}
          </ActionButton>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <label className="block text-lg">{t(STRINGS.codeSentTo)} {email}</label>
          <input inputMode="numeric" required autoComplete="one-time-code" value={code}
            onChange={(e) => setCode(e.target.value.trim())} className={inputClass} />
          <ActionButton pending={pending === "verify"} pendingLabel={t(STRINGS.signingIn)} className={buttonClass}>
            {t(STRINGS.signInButton)}
          </ActionButton>
          <button
            type="button"
            onClick={() => setCodeSent(false)}
            disabled={pending !== null}
            className="w-full p-2 text-blue-500 disabled:opacity-50"
          >
            {t(STRINGS.useAnotherEmail)}
          </button>
        </form>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
