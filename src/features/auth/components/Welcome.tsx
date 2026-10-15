"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner } from "@/lib/useBanner";
import { problemWith, type SignInProblem } from "../errors";
import { useEmailLink } from "../hooks/useEmailLink";
import { useProblemBanner } from "../hooks/useProblemBanner";
import { useTypedEmail } from "../hooks/useTypedEmail";
import { PROBLEMS, STRINGS } from "../strings";
import CheckEmail from "./CheckEmail";
import ForgotPasswordForm from "./ForgotPasswordForm";
import SignedOutFrame from "./SignedOutFrame";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

type Screen = "signIn" | "signUp" | "forgot";

// Signed out. Sign-in comes first and is the whole of it for someone who has an account (one screen, no
// bar). A new member goes on to the setup steps, with the bar: name and account, then the email's link;
// the root layout then shows notifications and the wait for an admin.
// `problem`: why the last sign-in failed, when the sign-in route sent the person back here.
export default function Welcome({ problem }: { problem: SignInProblem | null }) {
  const { t } = useLanguage(); // I18N
  const showBanner = useBanner();
  const sayWhy = (error: unknown) => showBanner({ kind: "error", message: t(PROBLEMS[problemWith(error)]) });
  const { sentTo, waitingFor, needsSignIn, createAccount, resetPassword, startOver } = useEmailLink(sayWhy);
  const [screen, setScreen] = useState<Screen>("signIn");
  // Kept here, so moving between the screens never loses what was typed.
  const [email, setEmail] = useTypedEmail();
  const [password, setPassword] = useState("");
  // A failed sign-in comes back here: say why in a banner, with the way out as its link.
  useProblemBanner(problem, (cause) =>
    cause === "noAccount"
      ? { label: t(STRINGS.createNewAccountQuestion), onAct: () => setScreen("signUp") }
      : cause === "wrongPassword"
        ? { label: t(STRINGS.forgotPassword), onAct: () => setScreen("forgot") }
        : undefined,
  );

  if (sentTo !== null) {
    return (
      <SignedOutFrame step={waitingFor === "signup" ? "email" : undefined}>
        <CheckEmail
          sentTo={sentTo}
          onStartOver={startOver}
          onSignIn={
            needsSignIn
              ? () => {
                  startOver();
                  setEmail(sentTo);
                  setScreen("signIn");
                }
              : undefined
          }
        />
      </SignedOutFrame>
    );
  }

  return (
    <SignedOutFrame step={screen === "signUp" ? "name" : undefined}>
      {screen === "signIn" && (
        <SignInForm
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onCreateAccount={() => setScreen("signUp")}
          onForgotPassword={() => setScreen("forgot")}
        />
      )}
      {screen === "signUp" && (
        <SignUpForm
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onCreate={(name, email, password) => createAccount(name, email, password).catch(sayWhy)}
          onHaveAccount={() => setScreen("signIn")}
        />
      )}
      {screen === "forgot" && (
        <>
          <ForgotPasswordForm email={email} onEmailChange={setEmail} onSend={(email) => resetPassword(email).catch(sayWhy)} />
          <Button variant="text" onClick={() => setScreen("signIn")}>
            {t(STRINGS.backToSignIn)}
          </Button>
        </>
      )}
    </SignedOutFrame>
  );
}
