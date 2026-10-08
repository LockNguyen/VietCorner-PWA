import { SendHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import IconButton from "./IconButton";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  sendLabel: string;
  disabled?: boolean;
  maxLength?: number;
  children?: ReactNode;
};

const FIELD =
  "min-h-touch min-w-0 flex-1 rounded-full bg-fill px-4 text-body text-ink placeholder:text-subtle " +
  "focus-visible:outline-2 focus-visible:outline-action";

// Where a message is written: a pill field and the send button, held at the bottom above the tabs.
// `children` sit above the field (the assistant's microphone). The screen leaves room under its messages.
export default function Composer({ value, onChange, onSend, placeholder, sendLabel, disabled, maxLength, children }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-tabs z-10 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-column flex-col gap-2 px-3 py-2">
        {children}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
          className="flex items-center gap-1"
        >
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            maxLength={maxLength}
            className={FIELD}
          />
          <IconButton label={sendLabel} tone="action" disabled={disabled}>
            <SendHorizontal />
          </IconButton>
        </form>
      </div>
    </div>
  );
}
