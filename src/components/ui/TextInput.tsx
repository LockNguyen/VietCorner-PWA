import type { InputHTMLAttributes } from "react";
import { CONTROL } from "./controlLook";

type Props = InputHTMLAttributes<HTMLInputElement>;

// One line of typed input. `type` makes it an email, a date, a time or a date with a time.
// `appearance-none`: an iPhone otherwise sizes date and time fields itself, wider than the screen allows.
export default function TextInput(input: Props) {
  return <input {...input} className={`${CONTROL} appearance-none`} />;
}
