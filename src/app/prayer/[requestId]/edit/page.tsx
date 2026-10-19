import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RequestEditor from "@/features/prayer/components/RequestEditor";
import { getMyRequest } from "@/features/prayer/server/queries";
import { STRINGS } from "@/features/prayer/strings";
import { createClient } from "@/lib/supabase/server";

// Editing one of my requests, opened from its options. Courtesy, not security: RLS ignores an edit of
// anyone else's request.
export default async function EditPrayerRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const request = await getMyRequest(await createClient(), requestId);
  if (!request) notFound();

  return (
    <>
      <PageHeader title={STRINGS.editTitle} backHref="/prayer" />
      <RequestEditor request={request} />
    </>
  );
}
