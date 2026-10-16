import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/format";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/40 p-3 pt-6 sm:p-4 sm:pt-10"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cx(
          "w-full animate-in rounded-2xl bg-white shadow-2xl",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6 sm:py-4">
          <h3 className="truncate pr-2 text-sm font-semibold text-ink sm:text-base">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
