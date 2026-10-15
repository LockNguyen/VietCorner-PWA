import { Pencil } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import Text from "@/components/ui/Text";

type Props = {
  label: string;
  value: string; // what to show; the caller passes a "not said yet" for an empty one it wants shown
  editLabel?: string; // what a screen reader calls the pencil
  onEdit?: () => void; // given only to someone who may change it: that is what draws the pencil
};

// One thing about a group: a small label over the words, as typed (line breaks kept), and a pencil at the
// right for someone who may change it.
export default function GroupDetail({ label, value, editLabel, onEdit }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col whitespace-pre-wrap wrap-anywhere">
        <Text variant="small" tone="subtle">{label}</Text>
        <Text>{value}</Text>
      </div>
      {onEdit && (
        <IconButton label={`${editLabel}: ${label}`} onClick={onEdit}>
          <Pencil />
        </IconButton>
      )}
    </div>
  );
}
