"use client";

import { useState, type ReactNode } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { problemWith } from "../errors";
import { useEmailLink } from "../hooks/useEmailLink";
import { PROBLEMS, STRINGS } from "../strings";
import CheckEmail from "./CheckEmail";
import SignedOutFrame from "./SignedOutFrame";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

// Signed out. Sign-in comes first and is the whole of it for someone who has an account: their email, then
// the link in their mailbox (one screen, no bar). A new member goes on to the setup steps, with the bar:
// name and email, then the link; the root layout then shows notifications and the wait for an admin.
// `signUpExtra`: what the page adds to the sign-up screen from another feature (the text size).
export default function Welcome({ signUpExtra }: { signUpExtra?: ReactNode }) {
  const { t } = useLanguage(); // I18N
  const showBanner = useBanner();
  const [screen, setScreen] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState(""); // shared, so "Create new account?" starts with it filled in

  // Why a step failed, in the app's banner. "No account yet" carries the way out as its link.
  function sayWhy(error: unknown) {
    const problem = problemWith(error);
    showBanner({
      kind: "error",
      message: t(PROBLEMS[problem]),
      action: problem === "noAccount" ? { label: t(STRINGS.createNewAccountQuestion), onAct: () => setScreen("signUp") } : undefined,
    });
  }
  const { sentTo, signIn, createAccount, startOver } = useEmailLink(sayWhy);

  if (sentTo !== null) {
    return (
      <SignedOutFrame step={screen === "signUp" ? "email" : undefined}>
        <CheckEmail sentTo={sentTo} onStartOver={startOver} />
      </SignedOutFrame>
    );
  }

  return (
    <SignedOutFrame step={screen === "signUp" ? "name" : undefined} onBack={screen === "signUp" ? () => setScreen("signIn") : undefined}>
      {screen === "signIn" ? (
        <SignInForm
          email={email}
          onEmailChange={setEmail}
          onSignIn={(email) => signIn(email).catch(sayWhy)}
          onCreateAccount={() => setScreen("signUp")}
        />
      ) : (
        <SignUpForm
          email={email}
          onEmailChange={setEmail}
          onCreate={(name, email) => createAccount(name, email).catch(sayWhy)}
          extra={signUpExtra}
        />
      )}
    </SignedOutFrame>
  );
}
