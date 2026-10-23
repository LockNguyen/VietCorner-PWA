import { formatPhone } from "@/lib/phone";
import TextInput from "./TextInput";

type Props = { value: string; onChange: (value: string) => void };

// A phone number field: the number pad, digits only, shaped "(336) 123-4567" as it is typed (`formatPhone`).
// Every phone field uses this one, so they all accept and show numbers the same way.
export default function PhoneInput({ value, onChange }: Props) {
  return (
    <TextInput
      type="tel"
      inputMode="numeric"
      autoComplete="off"
      placeholder="(336) 555-0101"
      value={value}
      onChange={(event) => onChange(formatPhone(event.target.value))}
    />
  );
}
