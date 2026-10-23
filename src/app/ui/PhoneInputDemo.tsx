"use client";

import { useState } from "react";
import Field from "@/components/ui/Field";
import PhoneInput from "@/components/ui/PhoneInput";

// A phone field to type into: digits only, shaped "(336) 123-4567" as they arrive.
export default function PhoneInputDemo() {
  const [phone, setPhone] = useState("");
  return (
    <Field label="Số điện thoại liên hệ">
      <PhoneInput value={phone} onChange={setPhone} />
    </Field>
  );
}
