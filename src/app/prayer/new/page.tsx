import PageHeader from "@/components/PageHeader";
import PrayerComposer from "@/features/prayer/components/PrayerComposer";
import { STRINGS } from "@/features/prayer/strings";

// A new prayer request, opened from the + on the Prayer tab. Sharing leads back to the list.
export default function NewPrayerRequestPage() {
  return (
    <>
      <PageHeader title={STRINGS.addRequest} backHref="/prayer" />
      <PrayerComposer />
    </>
  );
}
