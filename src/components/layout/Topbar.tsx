import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Menu, LogOut, X, AlertTriangle } from "lucide-react";
import { NAV_ALL } from "@/lib/constants";
import { authService } from "@/features/auth/auth.service";
import { useSession } from "@/features/auth/useSession";

interface TopbarProps {
  currentPath: string;
  onOpenMobileMenu: () => void;
}

export function Topbar({ currentPath, onOpenMobileMenu }: TopbarProps) {
  const navigate = useNavigate();
  const { session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const current = NAV_ALL.find((n) => n.path === currentPath);
  const email = session?.user?.email ?? "";
  const initial = email[0]?.toUpperCase() ?? "?";

  // ── Handle ESC untuk tutup ────────────────────
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        if (!loggingOut) setShowLogoutConfirm(false);
      }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [loggingOut]);

  // ── Logout handler ────────────────────────────
  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authService.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("[logout]", err);
      setLoggingOut(false);
    }
  }

  // ── Buka modal konfirmasi ─────────────────────
  function askLogout() {
    setMenuOpen(false);
    setShowLogoutConfirm(true);
  }

  return (
    <>
      <header
        className="sticky top-0 z-[80] flex items-center justify-between border-b px-4 py-3 sm:px-6 md:px-8"
        style={{
          background: "#FFFFFF",
          borderColor: "#E5E0F0",
          boxShadow: "0 1px 0 rgba(124,58,237,0.04)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-lg border border-line p-2 text-sub transition hover:bg-slate-50 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 items-center gap-2 text-sub">
            <span className="hidden shrink-0 text-sm sm:inline">Workspace</span>
            <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:inline" />
            <span className="truncate text-sm font-medium text-ink">
              {current?.label ?? ""}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span
            className="hidden items-center rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex"
            style={{
              backgroundColor: "rgba(22,163,74,0.12)",
              color: "#16A34A",
            }}
          >
            AI AKTIF
          </span>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-line px-2 py-1.5 text-xs transition hover:bg-primary-light"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                {initial}
              </div>
              <span className="hidden max-w-[120px] truncate text-sub sm:inline">
                {email}
              </span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-[85]"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-[86] mt-1 w-56 rounded-lg border border-line bg-white py-1 shadow-lg">
                  <div className="border-b border-line px-3 py-2">
                    <div className="truncate text-xs font-medium text-ink">
                      {email}
                    </div>
                    <div className="text-[10px] text-sub">Signed in</div>
                  </div>
                  <button
                    onClick={askLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-danger transition hover:bg-danger-bg"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Modal Konfirmasi Logout ── */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => !loggingOut && setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg">
                  <AlertTriangle className="h-4 w-4 text-danger" />
                </div>
                <span className="text-sm font-semibold text-ink">
                  Konfirmasi Keluar
                </span>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="rounded-lg p-1.5 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="h-4 w-4 text-sub" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-sm text-ink">
                Yakin ingin keluar dari akun ini?
              </p>
              <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                <div className="text-[10px] text-sub">Anda login sebagai</div>
                <div className="truncate text-xs font-medium text-ink">
                  {email}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 border-t border-line px-5 py-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 rounded-lg border border-line py-2.5 text-sm font-medium text-sub transition hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loggingOut ? (
                  <>
                    <span className="spinner" />
                    Keluar…
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Ya, Keluar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
