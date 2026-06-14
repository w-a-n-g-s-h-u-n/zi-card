import type { ReactNode } from "react";

type PracticeLayoutProps = {
  children: ReactNode;
};

export function PracticeLayout({ children }: PracticeLayoutProps) {
  return <main className="practice-layout">{children}</main>;
}
