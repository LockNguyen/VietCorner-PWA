"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import LogoMark from "@/components/ui/LogoMark";
import Text from "@/components/ui/Text";
import TextInput from "@/components/ui/TextInput";
import { sendLoginCode, verifyLoginCode } from "../api";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { usePending } from "@/lib/usePending";
import { problemWith } from "../errors";
import { PROBLEMS, STRINGS } from "../strings";

// Two steps: 1) enter email → a code is emailed. 2) type the code → signed in.
// Why a typed code instead of a clicked link: on iPhone, email links open in Safari,
// which does not share its login with the app installed on the Home Screen.
export default function LoginForm() {
  const router = useRouter();
  const { t } = useLanguage(); // I18N
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const showBanner = useBanner();
  // One request at a time: a second tap on "Send me a code" used to email a second, different code.
  const { pending, run } = usePending<"send" | "verify">();

  function handleSendCode(event: React.FormEvent) {
    event.preventDefault();
    run("send", async () => {
      try {
        await sendLoginCode(email);
        setCodeSent(true);
      } catch (error) {
        showBanner({ kind: "error", message: t(PROBLEMS[problemWith(error)]) });
      }
    });
  }

  function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault();
    run("verify", async () => {
      try {
        await verifyLoginCode(email, code);
        router.replace("/");
        router.refresh(); // re-run the proxy so it sees the new login cookie
      } catch (error) {
        showBanner({ kind: "error", message: t(PROBLEMS[problemWith(error)]) });
      }
    });
  }

  // The one screen whose fields carry their hint inside: the sentence above each says what to enter.
  return (
    <div className="flex flex-col items-center gap-6 px-5 pt-12">
      <LogoMark />
      {!codeSent ? (
        <form onSubmit={handleSendCode} className="flex w-full flex-col gap-3">
          <div className="pb-3 text-center">
            <Text as="h2" variant="tile">{t(STRINGS.emailPrompt)}</Text>
          </div>
          <TextInput
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t(STRINGS.emailLabel)}
            aria-label={t(STRINGS.emailLabel)}
          />
          <Button pending={pending === "send"} pendingLabel={t(STRINGS.sendingCode)}>
            {t(STRINGS.sendCodeButton)}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="flex w-full flex-col gap-3">
          <div className="pb-3 text-center wrap-anywhere">
            <Text as="h2" variant="tile">{t(STRINGS.codeSentTo)} {email}</Text>
          </div>
          <TextInput
            inputMode="numeric"
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.trim())}
            placeholder={t(STRINGS.codeLabel)}
            aria-label={t(STRINGS.codeLabel)}
          />
          <Button pending={pending === "verify"} pendingLabel={t(STRINGS.signingIn)}>
            {t(STRINGS.signInButton)}
          </Button>
          <Button type="button" variant="text" onClick={() => setCodeSent(false)} disabled={pending !== null}>
            {t(STRINGS.useAnotherEmail)}
          </Button>
        </form>
      )}
    </div>
  );
}
