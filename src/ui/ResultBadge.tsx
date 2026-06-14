import type { LucideIcon } from "lucide-react";

type ResultBadgeProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: "green" | "yellow" | "blue";
};

export function ResultBadge({ icon: Icon, label, value, tone }: ResultBadgeProps) {
  return (
    <div className="result-badge" data-tone={tone}>
      <Icon aria-hidden="true" size={24} strokeWidth={2.4} />
      <div>
        <div className="result-value">{value}</div>
        <div className="result-label">{label}</div>
      </div>
    </div>
  );
}
