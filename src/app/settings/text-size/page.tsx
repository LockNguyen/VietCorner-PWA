import PageHeader from "@/components/PageHeader";
import TextSizeChoice from "@/features/text-size/components/TextSizeChoice";
import { STRINGS } from "@/features/text-size/strings";

// Settings > Text size: small or big, a tick on the one in use.
export default function SettingsTextSizePage() {
  return (
    <>
      <PageHeader title={STRINGS.heading} backHref="/settings" />
      <TextSizeChoice />
    </>
  );
}
