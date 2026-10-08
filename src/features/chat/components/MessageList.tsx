"use client";

import Avatar from "@/components/ui/Avatar";
import Bubble from "@/components/ui/Bubble";
import BubbleRun from "@/components/ui/BubbleRun";
import TimeLine from "@/components/ui/TimeLine";
import { useLanguage } from "@/features/i18n/hooks/useLanguage"; // I18N
import { LOCALES } from "@/features/i18n/types"; // I18N
import type { Names } from "@/features/profiles/types"; // PROFILES
import { CHURCH_TIME_ZONE } from "@/lib/churchTime";
import { useScrollToEnd } from "@/lib/useScrollToEnd";
import { intoRuns } from "../runs";
import type { Message } from "../types";

type Props = { messages: Message[]; names: Names; myUserId: string };

// The conversation: mine at the right, others at the left under their name. Stays scrolled to the newest.
export default function MessageList({ messages, names, myUserId }: Props) {
  const { language } = useLanguage(); // I18N
  const end = useScrollToEnd(messages);

  // Church time, like every date in the app: the server and the phone then print the same words.
  const when = (at: string) =>
    new Date(at).toLocaleString(LOCALES[language], {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone: CHURCH_TIME_ZONE,
    });

  return (
    <div role="log" className="flex flex-col gap-4 px-3 pt-2 pb-16">
      {intoRuns(messages).map((item) => {
        if (item.kind === "time") return <TimeLine key={`time-${item.at}`}>{when(item.at)}</TimeLine>;

        const mine = item.senderId === myUserId;
        return (
          <BubbleRun
            key={item.messages[0].id}
            side={mine ? "mine" : "theirs"}
            name={mine ? undefined : names[item.senderId]}
            avatar={mine ? undefined : <Avatar size="small" />}
          >
            {item.messages.map((message) => (
              <Bubble key={message.id} tone={mine ? "mine" : "theirs"}>
                {message.body}
              </Bubble>
            ))}
          </BubbleRun>
        );
      })}
      <div ref={end} />
    </div>
  );
}
