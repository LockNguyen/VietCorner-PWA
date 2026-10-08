import type { InputHTMLAttributes } from "react";
import { CONTROL } from "./controlLook";

type Props = InputHTMLAttributes<HTMLInputElement>;

// One line of typed input. `type` makes it an email, a date, a time or a date with a time.
export default function TextInput(input: Props) {
  return <input {...input} className={CONTROL} />;
}
