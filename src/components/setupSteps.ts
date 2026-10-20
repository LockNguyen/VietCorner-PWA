// Every step a new member can go through, in order. Each feature's step screen names its own, so the bar
// stays right when a step is removed: delete its name here. Signing in is not a step (it is the whole of it
// for someone with an account): choosing the text size is step 1, then name and email (the user, 2026-10-17).
// "done" is never shown: it is there so that the last screen, waiting for an admin, reads as not finished yet.
// "install" is shown here only to someone already signed in in a browser (a computer, Android). Since
// 2026-10-20 a phone's browser shows the install guide on `/login`, before any of these steps, with no bar.
export const SETUP_STEPS = ["textSize", "name", "email", "install", "notifications", "waiting", "done"] as const;

export type SetupStep = (typeof SETUP_STEPS)[number];

// What this phone already has, which decides two of the steps.
export type DeviceFacts = {
  installed: boolean; // opened from the Home Screen: the install step is skipped
  notificationsAnswered: boolean; // asked before on this phone (push feature's cookie): skipped
  canNotify: boolean; // false in a browser that cannot receive notifications at all: skipped
};

// The steps this person will actually see, so the bar counts "2 / 5" without gaps (the user, 2026-10-17:
// it jumped from 2 to 5 on a phone that skipped two). The step on screen is always kept.
export function stepsFor(device: DeviceFacts, current: SetupStep): SetupStep[] {
  return SETUP_STEPS.filter((step) => {
    if (step === current) return true;
    if (step === "install") return !device.installed;
    if (step === "notifications") return device.canNotify && !device.notificationsAnswered;
    return true;
  });
}
