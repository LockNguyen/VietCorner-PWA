import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import PastTranslations from "@/features/prayer/components/PastTranslations";
import { getPastTranslations } from "@/features/prayer/server/queries";
import { STRINGS } from "@/features/prayer/strings";
import { REVIEW_TRANSLATIONS } from "@/features/prayer/types";
import { createClient } from "@/lib/supabase/server";

// The approved translations, opened from the first row of the Admin tab's translations. Courtesy, not security:
// the database function answers nothing to anyone without "prayer.translations".
export default async function PastTranslationsPage() {
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(REVIEW_TRANSLATIONS)) notFound();

  return (
    <>
      <PageHeader title={STRINGS.pastTranslations} backHref="/admin" />
      <PastTranslations requests={await getPastTranslations(supabase)} />
    </>
  );
}
