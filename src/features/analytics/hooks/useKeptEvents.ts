"use client";

import { useEffect } from "react";
import { keepFor } from "../queue";

// Tells the queue whose events it holds (queue.ts `keepFor`): what this person left unsent last time is sent
// now, and from now on their unsent events are kept on the phone until they go.
export function useKeptEvents(userId: string) {
  useEffect(() => keepFor(userId), [userId]);
}
