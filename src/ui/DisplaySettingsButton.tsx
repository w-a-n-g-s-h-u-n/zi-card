import { Settings } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "./IconButton";

type DisplaySettingsButtonProps = {
  children: ReactNode | ((controls: { close: () => void }) => ReactNode);
};

export function DisplaySettingsButton({ children }: DisplaySettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="display-settings" ref={rootRef}>
      <IconButton
        aria-expanded={isOpen}
        className="display-settings-trigger"
        icon={Settings}
        label="显示设置"
        title="显示设置"
        variant="quiet"
        onClick={() => setIsOpen((current) => !current)}
      />
      {isOpen ? (
        <div className="display-settings-popover">
          {typeof children === "function" ? children({ close: () => setIsOpen(false) }) : children}
        </div>
      ) : null}
    </div>
  );
}
