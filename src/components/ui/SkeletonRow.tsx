// A grey stand-in in the shape of a ListRow, shown while a list loads so the screen does not jump.
export default function SkeletonRow() {
  return (
    <li aria-hidden className="ms-3 flex min-h-row items-center gap-3 border-b border-line py-2 pe-3 motion-safe:animate-pulse">
      <span className="h-15 w-22 shrink-0 rounded-thumb bg-fill" />
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-4 w-40 rounded-thumb bg-fill" />
        <span className="h-3 w-24 rounded-thumb bg-fill" />
      </span>
    </li>
  );
}
