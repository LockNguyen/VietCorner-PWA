// The address of a file in a PUBLIC Supabase Storage bucket. It needs no request and no sign-in to work it
// out, and it never changes for a given path, so a phone keeps the picture instead of downloading it again.
// Only for buckets made public on purpose (row thumbnails); private pictures are signed (group-info).
export function publicFileUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
