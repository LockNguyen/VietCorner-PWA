// The turning circle that means "working on it". It takes the colour of the text around it.
// `align-middle` centres it on the lowercase letters beside it, which is where the eye reads "the middle".
export default function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block size-5 rounded-full align-middle border-2 border-current border-t-transparent motion-safe:animate-spin"
    />
  );
}
