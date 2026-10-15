import type { ReactNode } from "react";
import Text from "@/components/ui/Text";

type Props = { number: number; icon?: ReactNode; children: string };

// One numbered instruction, with the icon the person should look for on their screen.
export default function InstallStep({ number, icon, children }: Props) {
  return (
    <li className="flex items-start gap-3">
      <Text as="span" variant="tile">{number}.</Text>
      <div className="flex flex-1 flex-col gap-1">
        <Text>{children}</Text>
        {icon}
      </div>
    </li>
  );
}
