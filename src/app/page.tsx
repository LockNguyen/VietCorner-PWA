import HomeTiles from "@/components/HomeTiles";
import PageHeader from "@/components/PageHeader";
import { SHELL_STRINGS } from "@/components/strings";

// Home: where the app opens. Three tiles today, a dashboard later.
export default function HomePage() {
  return (
    <>
      <PageHeader title={SHELL_STRINGS.homeTab} />
      <HomeTiles />
    </>
  );
}
