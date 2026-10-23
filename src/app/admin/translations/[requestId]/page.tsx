import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import TranslationEditor from "@/features/prayer/components/TranslationEditor";
import { getTranslation } from "@/features/prayer/server/queries";
import { STRINGS } from "@/features/prayer/strings";
import { REVIEW_TRANSLATIONS } from "@/features/prayer/types";
import { createClient } from "@/lib/supabase/server";

// Correcting one request's translation, opened from the pencil on either of the reviewers' lists, and going back
// to that list. Courtesy, not security: the database function refuses an approval without "prayer.translations".
// A request no longer in the feed (answered, deleted) has nothing to edit.
export default async function EditTranslationPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(REVIEW_TRANSLATIONS)) notFound();
  const request = await getTranslation(supabase, requestId);
  if (!request) notFound();
  const list = request.translation_reviewed_at === null ? "/admin" : "/admin/translations"; // where it was opened from

  return (
    <>
      <PageHeader title={STRINGS.translationTitle} backHref={list} />
      <TranslationEditor request={request} backHref={list} />
    </>
  );
}
