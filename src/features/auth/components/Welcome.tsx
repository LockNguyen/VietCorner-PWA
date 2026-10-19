"use client";

import { useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { GO_BACK, GO_FORWARD, slide } from "@/lib/slide";
import { problemWith } from "../errors";
import { useEmailLink } from "../hooks/useEmailLink";
import { PROBLEMS, STRINGS } from "../strings";
import CheckEmail from "./CheckEmail";
import SignedOutFrame from "./SignedOutFrame";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

type Screen = "signIn" | "firstStep" | "signUp";

// Signed out. Sign-in comes first and is the whole of it for someone who has an account: their email, then
// the link in their mailbox (one screen, no bar). A new member goes through the setup steps, each sliding in
// from the right, each with a back arrow to the one before: `firstStep` (what the page brings: the text
// size), then name and email, then "check your email"; the root layout then shows the steps after sign-in.
export default function Welcome({ firstStep }: { firstStep: ReactNode }) {
  const { t } = useLanguage(); // I18N
  const showBanner = useBanner();
  const [screen, setScreen] = useState<Screen>("signIn");
  const [email, setEmail] = useState(""); // shared, so creating an account starts with it filled in
  const forward = (next: Screen) => slide(GO_FORWARD, () => setScreen(next));
  const back = (previous: Screen) => slide(GO_BACK, () => setScreen(previous));

  // Why a step failed, in the app's banner. "No account yet" carries the way out as its link.
  function sayWhy(error: unknown) {
    const problem = problemWith(error);
    showBanner({
      kind: "error",
      message: t(PROBLEMS[problem]),
      action: problem === "noAccount" ? { label: t(STRINGS.createNewAccountQuestion), onAct: () => forward("firstStep") } : undefined,
    });
  }
  const { sentTo, signIn, createAccount, startOver } = useEmailLink(sayWhy);

  if (sentTo !== null) {
    return (
      <SignedOutFrame step={screen === "signUp" ? "email" : undefined} onBack={startOver}>
        <CheckEmail sentTo={sentTo} />
      </SignedOutFrame>
    );
  }

  if (screen === "firstStep") {
    return (
      <SignedOutFrame step="textSize" onBack={() => back("signIn")}>
        {firstStep}
        <Button onClick={() => forward("signUp")}>{t(STRINGS.nextButton)}</Button>
      </SignedOutFrame>
    );
  }

  if (screen === "signUp") {
    return (
      <SignedOutFrame step="name" onBack={() => back("firstStep")}>
        <SignUpForm email={email} onEmailChange={setEmail} onCreate={(name, email) => createAccount(name, email).catch(sayWhy)} />
      </SignedOutFrame>
    );
  }

  return (
    <SignedOutFrame>
      <SignInForm
        email={email}
        onEmailChange={setEmail}
        onSignIn={(email) => signIn(email).catch(sayWhy)}
        onCreateAccount={() => forward("firstStep")}
      />
    </SignedOutFrame>
  );
}
