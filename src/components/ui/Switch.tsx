import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string };

const TRACK =
  "relative h-8 w-14 shrink-0 appearance-none rounded-full bg-line transition-colors checked:bg-action " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action disabled:opacity-50";
const THUMB = "before:absolute before:top-1 before:left-1 before:size-6 before:rounded-full before:bg-surface before:transition-transform checked:before:translate-x-6";

// On or off, with its label: the whole line is the tap target. A checkbox underneath, so forms and screen readers know it.
export default function Switch({ label, ...input }: Props) {
  return (
    <label className="flex min-h-touch items-center justify-between gap-3 text-body text-ink">
      {label}
      <input {...input} type="checkbox" role="switch" className={`${TRACK} ${THUMB}`} />
    </label>
  );
}
