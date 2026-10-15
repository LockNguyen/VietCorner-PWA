import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { CONTROL } from "./controlLook";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  shown: boolean; // the password as plain letters, or as dots
  onToggle: () => void;
  toggleLabel: string; // what a screen reader says for the eye
};

const BOX = "relative w-full";
const TOGGLE =
  "absolute inset-y-0 end-0 inline-flex w-touch items-center justify-center text-subtle " +
  "focus-visible:outline-2 focus-visible:outline-action";

// A password field with an eye at its end that shows or hides what was typed. Whether it is shown is the caller's.
export default function PasswordInput({ shown, onToggle, toggleLabel, ...input }: Props) {
  return (
    <div className={BOX}>
      <input {...input} type={shown ? "text" : "password"} className={`${CONTROL} pe-touch`} />
      <button type="button" onClick={onToggle} aria-label={toggleLabel} aria-pressed={shown} className={TOGGLE}>
        {shown ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </button>
    </div>
  );
}
