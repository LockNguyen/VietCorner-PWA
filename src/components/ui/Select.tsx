import type { SelectHTMLAttributes } from "react";
import { CONTROL } from "./controlLook";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

// One choice from a list, opened with the phone's own picker. Its children are the <option>s.
export default function Select(select: Props) {
  return <select {...select} className={CONTROL} />;
}
