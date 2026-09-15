import PageHeader from "@/components/PageHeader";
import AccountSection from "@/features/auth/AccountSection"; // AUTH

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <AccountSection /> {/* AUTH */}
      <p className="p-4 text-gray-500">Language and notification settings go here.</p>
    </>
  );
}
