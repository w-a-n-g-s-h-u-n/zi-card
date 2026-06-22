import { Eye } from "lucide-react";
import { Toggle } from "./Toggle";

type PinyinVisibilityToggleProps = {
  checked: boolean;
  label?: string;
  onCheckedChange: (checked: boolean) => void;
};

export function PinyinVisibilityToggle({
  checked,
  label = "拼音",
  onCheckedChange,
}: PinyinVisibilityToggleProps) {
  return (
    <Toggle
      checked={checked}
      icon={<Eye aria-hidden="true" size={21} />}
      label={label}
      onCheckedChange={onCheckedChange}
    />
  );
}
