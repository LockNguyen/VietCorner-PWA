import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import EventEditor from "@/features/events/components/EventEditor";
import { STRINGS } from "@/features/events/strings";
import { MANAGE_EVENTS } from "@/features/events/types";
import { getMyPermissions } from "@/features/permissions/server/queries";
import { createClient } from "@/lib/supabase/server";

// A new event, opened from the + on the Edit list by an admin. Courtesy, not security: the database
// refuses every save without the permission.
export default async function NewEventPage() {
  if (!(await getMyPermissions(await createClient())).includes(MANAGE_EVENTS)) notFound();

  return (
    <>
      <PageHeader title={STRINGS.newEvent} backHref="/events/manage" />
      <EventEditor event={undefined} listHref="/events/manage" />
    </>
  );
}
