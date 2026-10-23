import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import AnalyticsLink from "@/features/analytics/components/AnalyticsLink"; // ANALYTICS
import { VIEW_ANALYTICS } from "@/features/analytics/types"; // ANALYTICS
import { SHELL_STRINGS } from "@/components/strings";
import WaitingAccounts from "@/features/approval/components/WaitingAccounts"; // APPROVAL
import { getWaitingAccounts } from "@/features/approval/server/queries"; // APPROVAL
import { MANAGE_ACCOUNTS } from "@/features/approval/types"; // APPROVAL
import JoinRequests from "@/features/groups/components/JoinRequests";
import { getGroups, getJoinRequests } from "@/features/groups/server/queries";
import { MANAGE_GROUPS } from "@/features/groups/types";
import PeopleList from "@/features/people/components/PeopleList"; // PEOPLE
import { getPeople } from "@/features/people/server/queries"; // PEOPLE
import { MANAGE_USERS } from "@/features/people/types"; // PEOPLE
import { getMyPermissions } from "@/features/permissions/server/queries";
import TranslationReviews from "@/features/prayer/components/TranslationReviews"; // PRAYER
import { getTranslationsToReview } from "@/features/prayer/server/queries"; // PRAYER
import { REVIEW_TRANSLATIONS } from "@/features/prayer/types"; // PRAYER
import { managesSomething } from "@/features/permissions/types";
import NameRequestAdmin from "@/features/profiles/components/NameRequestAdmin"; // PROFILES
import { getNameRequests, getNames } from "@/features/profiles/server/queries"; // PROFILES
import { createClient } from "@/lib/supabase/server";
import { SWITCHES } from "@/lib/switches";

// The Admin tab: first what waits for an answer (new sign-ups, name changes, prayer translations, and join
// requests while joining is on), then everyone with an account. Groups, events and prayer reminders are managed on their own tabs.
// Each section shows only to someone with its permission (the admin README).
export default async function AdminPage() {
  const supabase = await createClient();
  const permissions = await getMyPermissions(supabase);
  // A member has no business here. This is courtesy, not security: with a forged token the page would
  // render, and every save would still be refused by the database.
  if (!managesSomething(permissions)) notFound();

  const managesGroups = permissions.includes(MANAGE_GROUPS);
  const joining = managesGroups && SWITCHES.joining;
  const nothing = Promise.resolve([]);

  // Read together: none of these needs another's answer. A section the user may not manage is not read.
  const [waiting, nameRequests, translations, requests, groups, people] = await Promise.all([
    permissions.includes(MANAGE_ACCOUNTS) ? getWaitingAccounts(supabase) : nothing, // APPROVAL
    managesGroups ? getNameRequests(supabase) : nothing, // PROFILES
    permissions.includes(REVIEW_TRANSLATIONS) ? getTranslationsToReview(supabase) : nothing, // PRAYER
    joining ? getJoinRequests(supabase) : nothing,
    joining ? getGroups(supabase) : nothing,
    permissions.includes(MANAGE_USERS) ? getPeople(supabase) : nothing, // PEOPLE
  ]);
  // What the people asking are called now: the one read that needs the lists first. PROFILES
  const names = await getNames(supabase, [...requests, ...nameRequests].map((request) => request.user_id));

  return (
    <>
      <PageHeader title={SHELL_STRINGS.adminTab} backHref="/" />
      {permissions.includes(MANAGE_ACCOUNTS) && <WaitingAccounts accounts={waiting} />} {/* APPROVAL */}
      {managesGroups && <NameRequestAdmin requests={nameRequests} names={names} />} {/* PROFILES */}
      {permissions.includes(REVIEW_TRANSLATIONS) && <TranslationReviews requests={translations} />} {/* PRAYER */}
      {joining && <JoinRequests requests={requests} groups={groups} names={names} />}
      {permissions.includes(MANAGE_USERS) && <PeopleList people={people} />} {/* PEOPLE */}
      {permissions.includes(VIEW_ANALYTICS) && <AnalyticsLink />} {/* ANALYTICS */}
    </>
  );
}
