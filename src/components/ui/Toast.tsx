import { Check } from "lucide-react";

export interface ToastItem {
  id: number;
  msg: string;
}

export function Toast({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex max-w-[calc(100vw-40px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex animate-in items-center gap-2 rounded-xl px-4 py-3 text-sm text-white shadow-lg"
          style={{ backgroundColor: "#0F1729" }}
        >
          <Check className="h-4 w-4" style={{ color: "#7CF29C" }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
