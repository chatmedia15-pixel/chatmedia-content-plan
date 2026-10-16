import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cx } from "@/lib/format";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  iconColor?: string;
  iconBg?: string;
  gradient?: string;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  iconColor = "#2F5CFF",
  iconBg = "#EEF2FF",
  gradient,
}: KpiCardProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-4 transition hover:shadow-md sm:p-5",
        gradient ? "border-transparent" : "border-line bg-white",
      )}
      style={{
        backgroundImage: gradient ?? undefined,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            backgroundColor: gradient ? "rgba(255,255,255,0.2)" : iconBg,
          }}
        >
          <Icon
            className="h-4 w-4"
            style={{ color: gradient ? "#fff" : iconColor }}
          />
        </div>
        {trend !== undefined && (
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: trend > 0 ? "#EAFBF1" : "#FDECEC",
              color: trend > 0 ? "#16A34A" : "#DC2626",
            }}
          >
            {trend > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div
        className="text-[11px] font-medium uppercase tracking-wide"
        style={{ color: gradient ? "rgba(255,255,255,0.85)" : "#5B6478" }}
      >
        {label}
      </div>
      <div
        className="mt-1 truncate text-xl font-bold sm:text-2xl"
        style={{ color: gradient ? "#fff" : "#0F1729" }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mt-1 truncate text-[10px] sm:text-[11px]"
          style={{ color: gradient ? "rgba(255,255,255,0.75)" : "#5B6478" }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
