// The turning circle that means "working on it". It takes the colour of the text around it.
export default function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-5 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
    />
  );
}
