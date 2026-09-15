import PageHeader from "@/components/PageHeader";
import EnableNotificationsButton from "@/features/chat/components/EnableNotificationsButton";
import GroupList from "@/features/chat/components/GroupList";

export default function GroupsPage() {
  return (
    <>
      <PageHeader title="Groups" />
      <EnableNotificationsButton />
      <GroupList />
    </>
  );
}
