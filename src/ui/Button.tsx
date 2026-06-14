import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "normal" | "large";
  selected?: boolean;
  children: ReactNode;
};

export function Button({
  icon: Icon,
  variant = "primary",
  size = "normal",
  selected = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`}
      data-selected={selected ? "true" : "false"}
      type="button"
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" size={22} strokeWidth={2.4} /> : null}
      <span>{children}</span>
    </button>
  );
}
