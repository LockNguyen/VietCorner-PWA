import type { TextareaHTMLAttributes } from "react";
import { CONTROL } from "./controlLook";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

// Several lines of typed input.
export default function TextArea(area: Props) {
  return <textarea {...area} className={`${CONTROL} py-3`} />;
}
