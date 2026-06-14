import type { LucideIcon } from "lucide-react";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

type SegmentedControlProps<T extends string> = {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="segmented-field">
      <div className="field-label">{label}</div>
      <div className="segmented-control" role="tablist" aria-label={label}>
        {options.map((option) => {
          const Icon = option.icon;
          const selected = option.value === value;

          return (
            <button
              aria-selected={selected}
              className="segment"
              data-selected={selected ? "true" : "false"}
              key={option.value}
              role="tab"
              type="button"
              onClick={() => onChange(option.value)}
            >
              {Icon ? <Icon aria-hidden="true" size={21} strokeWidth={2.4} /> : null}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
