"use client";

import Spinner from "@/components/ui/Spinner";
import Text from "@/components/ui/Text";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { useWhenVisible } from "../hooks/useWhenVisible";
import { STRINGS } from "../strings";

type Props = { onReached: () => void; loadedSoFar: number };

// Sits under the last request while older ones exist. Scrolling it into view loads the next page, so
// there is no "load more" button to find. The board removes it when the last page has arrived.
export default function OlderRequestsMarker({ onReached, loadedSoFar }: Props) {
  const { t } = useLanguage(); // I18N
  const marker = useWhenVisible<HTMLDivElement>(onReached, loadedSoFar);

  return (
    <div ref={marker} className="p-4 text-center">
      <Text as="span" tone="subtle">
        <Spinner /> {t(STRINGS.loadingOlder)}
      </Text>
    </div>
  );
}
