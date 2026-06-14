import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  variant?: "default" | "quiet" | "danger";
};

export function IconButton({
  icon: Icon,
  label,
  variant = "default",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`icon-button icon-button--${variant} ${className}`}
      type="button"
      {...props}
    >
      <Icon aria-hidden="true" size={24} strokeWidth={2.3} />
    </button>
  );
}
