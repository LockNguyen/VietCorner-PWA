"use client";

import { useEffect } from "react";
import { record } from "../queue";

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

// Records every error no code caught: a crash in a screen's code, or a request whose failure nobody handled.
export function useErrorTracking() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => record("error", { target: event.message, detail: { source: "script" } });
    const onRejection = (event: PromiseRejectionEvent) =>
      record("error", { target: messageOf(event.reason), detail: { source: "script" } });
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
}
