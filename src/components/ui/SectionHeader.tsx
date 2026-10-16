import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}

export function SectionHeader({
  eyebrow,
  title,
  desc,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="mb-1 text-xs font-medium text-primary">{eyebrow}</div>
        )}
        <h2 className="text-lg font-bold text-ink sm:text-xl">{title}</h2>
        {desc && <p className="mt-1 text-xs text-sub sm:text-sm">{desc}</p>}
      </div>
      {action}
    </div>
  );
}
