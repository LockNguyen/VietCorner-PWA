import SkeletonRow from "@/components/ui/SkeletonRow";

const ROWS = [1, 2, 3, 4, 5, 6];

// Shown at once while any page renders on the server: dynamic pages are not prefetched, so without it a
// tap shows nothing until the server answers.
export default function Loading() {
  return (
    <ul aria-busy="true">
      {ROWS.map((row) => (
        <SkeletonRow key={row} />
      ))}
    </ul>
  );
}
