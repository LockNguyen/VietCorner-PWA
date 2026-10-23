import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import TranslationEditor from "@/features/prayer/components/TranslationEditor";
import { getTranslationsToReview } from "@/features/prayer/server/queries";
import { STRINGS } from "@/features/prayer/strings";
import { REVIEW_TRANSLATIONS } from "@/features/prayer/types";
import { createClient } from "@/lib/supabase/server";

// Correcting one request's translation, opened from Edit on the Admin tab's review list. Courtesy, not security:
// the database function refuses an approval without "prayer.translations". A request no longer on the list
// (approved, answered, deleted) has nothing to edit.
export default async function EditTranslationPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(REVIEW_TRANSLATIONS)) notFound();
  const request = (await getTranslationsToReview(supabase)).find((each) => each.id === requestId);
  if (!request) notFound();

  return (
    <>
      <PageHeader title={STRINGS.translationTitle} backHref="/admin" />
      <TranslationEditor request={request} />
    </>
  );
}
