import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import RefreshOnArrival from "@/components/RefreshOnArrival";
import EventWeeklyForm from "@/features/events/components/EventWeeklyForm";
import { getWeeklyCard } from "@/features/events/server/queries";
import { STRINGS } from "@/features/events/strings";
import { MANAGE_EVENTS } from "@/features/events/types";
import { getMyPermissions } from "@/features/permissions/server/queries"; // PERMISSIONS
import { createClient } from "@/lib/supabase/server";

// The weekly card's editor: its title in both languages, the address and the number. Saving leads back to the
// Edit list. Courtesy, not security: the database refuses every save without the permission.
export default async function WeeklyCardEditorPage() {
  const supabase = await createClient();
  if (!(await getMyPermissions(supabase)).includes(MANAGE_EVENTS)) notFound();
  const card = await getWeeklyCard(supabase);
  if (!card) notFound(); // schema.sql 3h not run yet

  return (
    <>
      <PageHeader title={STRINGS.editFirstCard} backHref="/events/manage" />
      <RefreshOnArrival />
      {/* Keyed by what is stored: fresher values (RefreshOnArrival) restart the form from them. */}
      <EventWeeklyForm key={JSON.stringify(card)} initial={card} listHref="/events/manage" />
    </>
  );
}
