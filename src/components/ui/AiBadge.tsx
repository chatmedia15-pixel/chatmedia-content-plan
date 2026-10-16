import { Sparkles } from "lucide-react";

export function AiBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}
    >
      <Sparkles className="h-3 w-3" />
      AI
    </span>
  );
}
