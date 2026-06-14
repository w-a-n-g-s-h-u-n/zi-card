import * as Switch from "@radix-ui/react-switch";
import type { ReactNode } from "react";

type ToggleProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: ReactNode;
};

export function Toggle({ label, checked, onCheckedChange, icon }: ToggleProps) {
  return (
    <label className="toggle-row">
      <span className="toggle-label">
        {icon}
        {label}
      </span>
      <Switch.Root className="toggle-root" checked={checked} onCheckedChange={onCheckedChange}>
        <Switch.Thumb className="toggle-thumb" />
      </Switch.Root>
    </label>
  );
}
