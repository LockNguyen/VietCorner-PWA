import type { ReactNode } from "react";
import RoundIcon from "@/components/ui/RoundIcon";
import Text from "@/components/ui/Text";

type Props = { icon: ReactNode; children: string };

// One instruction: the button to look for, drawn as the phone draws it (a grey circle), and a few words.
export default function InstallStep({ icon, children }: Props) {
  return (
    <li className="flex items-center gap-4">
      <RoundIcon>{icon}</RoundIcon>
      <Text>{children}</Text>
    </li>
  );
}
