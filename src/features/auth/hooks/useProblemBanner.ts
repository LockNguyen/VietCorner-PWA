"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useBanner, type BannerAction } from "@/lib/useBanner";
import type { SignInProblem } from "../errors";
import { PROBLEMS } from "../strings";

// why: a banner with a link must be read and tapped; 8 seconds is too short for many members.
const WITH_LINK_SECONDS = 15;

// Says why the last try failed, once, in the app's banner, with a link when there is a way out
// ("Forgot password?"). The forms are real posts, so the reason arrives in the address (`?problem=`);
// it is taken out again so that a reload does not say it twice.
export function useProblemBanner(problem: SignInProblem | null, actionFor: (problem: SignInProblem) => BannerAction | undefined) {
  const { t } = useLanguage(); // I18N
  const showBanner = useBanner();
  const shown = useRef(false);
  const latestActionFor = useRef(actionFor);
  useEffect(() => {
    latestActionFor.current = actionFor;
  });

  useEffect(() => {
    if (!problem || shown.current) return;
    shown.current = true;
    const action = latestActionFor.current(problem);
    showBanner({ kind: "error", message: t(PROBLEMS[problem]), action, seconds: action ? WITH_LINK_SECONDS : undefined });
    window.history.replaceState(null, "", window.location.pathname);
  }, [problem, showBanner, t]);
}
