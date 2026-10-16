import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/format";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Card({ children, className, style, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cx(
        "rounded-2xl border bg-white transition-shadow",
        "border-[#C7D2FE]",
        "shadow-[0_2px_8px_-2px_rgba(47,92,255,0.10),0_1px_2px_rgba(47,92,255,0.06)]",
        "hover:shadow-[0_4px_16px_-4px_rgba(47,92,255,0.18)]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
