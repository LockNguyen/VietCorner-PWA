type Part = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string; // the language's own name, shown while this half is empty
  label: string; // what a screen reader calls this half
};

type Props = { top: Part; bottom: Part; rows?: number }; // rows: several lines (a description)

const BOX =
  "flex w-full flex-col rounded-control bg-fill " +
  "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-action";
const HALF = "w-full min-w-0 bg-transparent px-4 py-3 text-body text-ink placeholder:text-subtle outline-none";
const DIVIDER = "mx-4 border-t border-line";

// One text in two languages, as one grey box: the first language on top, a hairline, the other below. A
// translation is written right under its original, and an empty half shows which language it waits for.
export default function BilingualInput({ top, bottom, rows }: Props) {
  const half = (part: Part) =>
    rows ? (
      <textarea
        rows={rows}
        value={part.value}
        placeholder={part.placeholder}
        aria-label={part.label}
        onChange={(event) => part.onChange(event.target.value)}
        className={`${HALF} resize-none`}
      />
    ) : (
      <input
        value={part.value}
        placeholder={part.placeholder}
        aria-label={part.label}
        onChange={(event) => part.onChange(event.target.value)}
        className={HALF}
      />
    );

  return (
    <div className={BOX}>
      {half(top)}
      <div aria-hidden className={DIVIDER} />
      {half(bottom)}
    </div>
  );
}
