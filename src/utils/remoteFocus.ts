import { useEffect } from "react";

const REMOTE_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const CONFIRM_KEYS = ["Enter", "NumpadEnter", "OK", "Select"];
const CONFIRM_KEY_CODES = [13, 23];
const FOCUSABLE_SELECTOR = [
  "button:not(:disabled)",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type Direction = "up" | "down" | "left" | "right";

export function useRemoteFocusNavigation(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isConfirmKey(event)) {
        const target = getActiveConfirmTarget();

        if (target) {
          event.preventDefault();
          target.click();
        }

        return;
      }

      if (!REMOTE_KEYS.includes(event.key)) {
        return;
      }

      const direction = getDirection(event.key);

      if (!direction) {
        return;
      }

      const nextElement = findNextFocusable(direction);

      if (!nextElement) {
        return;
      }

      event.preventDefault();
      nextElement.focus();
      nextElement.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}

function isConfirmKey(event: KeyboardEvent): boolean {
  return CONFIRM_KEYS.includes(event.key) || CONFIRM_KEY_CODES.includes(event.keyCode);
}

function getDirection(key: string): Direction | null {
  if (key === "ArrowUp") {
    return "up";
  }

  if (key === "ArrowDown") {
    return "down";
  }

  if (key === "ArrowLeft") {
    return "left";
  }

  if (key === "ArrowRight") {
    return "right";
  }

  return null;
}

function getFocusableElements(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isFocusable);
}

function getActiveConfirmTarget(): HTMLElement | null {
  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (!activeElement || isTextInput(activeElement)) {
    return null;
  }

  if (activeElement.matches("button:not(:disabled), [role='button'], [tabindex]:not([tabindex='-1'])")) {
    return activeElement;
  }

  return null;
}

function isTextInput(element: HTMLElement): boolean {
  return (
    element instanceof HTMLTextAreaElement ||
    (element instanceof HTMLInputElement &&
      !["button", "checkbox", "radio", "range", "reset", "submit"].includes(element.type))
  );
}

function isFocusable(element: HTMLElement): boolean {
  if (element.closest("[aria-hidden='true']")) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function findNextFocusable(direction: Direction): HTMLElement | null {
  const elements = getFocusableElements();

  if (elements.length === 0) {
    return null;
  }

  const activeElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  if (!activeElement || activeElement === document.body) {
    return getFirstFocusable(elements);
  }

  const activeRect = activeElement.getBoundingClientRect();
  const candidate = elements
    .filter((element) => element !== activeElement)
    .map((element) => ({
      element,
      score: getDirectionalScore(activeRect, element.getBoundingClientRect(), direction),
    }))
    .filter((item) => item.score !== null)
    .sort((left, right) => (left.score ?? 0) - (right.score ?? 0))[0];

  return candidate?.element ?? null;
}

function getFirstFocusable(elements: HTMLElement[]): HTMLElement {
  return elements[0];
}

function getDirectionalScore(from: DOMRect, to: DOMRect, direction: Direction): number | null {
  const fromX = from.left + from.width / 2;
  const fromY = from.top + from.height / 2;
  const toX = to.left + to.width / 2;
  const toY = to.top + to.height / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;

  if (direction === "up" && dy >= -1) {
    return null;
  }

  if (direction === "down" && dy <= 1) {
    return null;
  }

  if (direction === "left" && dx >= -1) {
    return null;
  }

  if (direction === "right" && dx <= 1) {
    return null;
  }

  const isHorizontal = direction === "left" || direction === "right";
  const primaryDistance = isHorizontal ? Math.abs(dx) : Math.abs(dy);
  const secondaryDistance = isHorizontal ? Math.abs(dy) : Math.abs(dx);
  const isInBeam = isHorizontal ? rangesOverlap(from.top, from.bottom, to.top, to.bottom) : rangesOverlap(from.left, from.right, to.left, to.right);
  const beamPenalty = isInBeam ? 0 : 1_000_000;

  return beamPenalty + primaryDistance * 1000 + secondaryDistance;
}

function rangesOverlap(firstStart: number, firstEnd: number, secondStart: number, secondEnd: number): boolean {
  return Math.max(firstStart, secondStart) <= Math.min(firstEnd, secondEnd);
}
