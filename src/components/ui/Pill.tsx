import type { ReactNode } from "react";
import { cx } from "@/lib/format";

type Tone = "neutral" | "good" | "bad" | "warn" | "blue" | "purple";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: "#EEF1F6", fg: "#5B6478" },
  good: { bg: "#EAFBF1", fg: "#16A34A" },
  bad: { bg: "#FDECEC", fg: "#DC2626" },
  warn: { bg: "#FEF6E7", fg: "#D97706" },
  blue: { bg: "#EEF2FF", fg: "#2F5CFF" },
  purple: { bg: "#F5F3FF", fg: "#7C3AED" },
};

interface PillProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Pill({ tone = "neutral", children, className }: PillProps) {
  const c = TONES[tone];
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        className,
      )}
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {children}
    </span>
  );
}
