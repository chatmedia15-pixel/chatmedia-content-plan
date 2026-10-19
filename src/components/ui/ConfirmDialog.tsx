import { useEffect } from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  /** Nama item yang akan dihapus (ditampilkan tebal) */
  itemName?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = "Konfirmasi Hapus",
  itemName,
  message = "Tindakan ini tidak dapat dibatalkan.",
  confirmLabel = "Ya, Hapus",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="w-full max-w-sm animate-in rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg">
              <AlertTriangle className="h-4 w-4 text-danger" />
            </div>
            <span className="text-sm font-semibold text-ink">{title}</span>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg p-1.5 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="h-4 w-4 text-sub" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-ink">Yakin ingin menghapus?</p>
          {itemName && (
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
              <div className="break-words text-xs font-medium text-ink">
                {itemName}
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-sub">{message}</p>
        </div>

        <div className="flex gap-2 border-t border-line px-5 py-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-sub transition hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="spinner" />
                Menghapus…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
