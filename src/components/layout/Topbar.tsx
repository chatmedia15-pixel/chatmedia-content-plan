import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Menu, LogOut } from "lucide-react";
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

  const current = NAV_ALL.find((n) => n.path === currentPath);
  const email = session?.user?.email ?? "";
  const initial = email[0]?.toUpperCase() ?? "?";

  async function handleLogout() {
    await authService.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header
      className="sticky top-0 z-[80] flex items-center justify-between border-b px-4 py-3 sm:px-6 md:px-8"
      style={{
        background: "linear-gradient(135deg, #142344 0%, #1E3060 100%)",
        borderColor: "rgba(47,92,255,0.20)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.03), 0 4px 12px -4px rgba(0,0,0,0.15)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onOpenMobileMenu}
          className="rounded-lg border p-2 md:hidden"
          style={{ borderColor: "rgba(255,255,255,0.2)" }}
        >
          <Menu className="h-4 w-4 text-white" />
        </button>
        <div
          className="flex min-w-0 items-center gap-2"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          <span className="hidden shrink-0 text-sm sm:inline">Workspace</span>
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 sm:inline" />
          <span className="truncate text-sm font-medium text-white">
            {current?.label ?? ""}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span
          className="hidden items-center rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex"
          style={{ backgroundColor: "rgba(22,163,74,0.15)", color: "#4ADE80" }}
        >
          AI AKTIF
        </span>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition hover:bg-white/10"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
              {initial}
            </div>
            <span className="hidden max-w-[120px] truncate text-white/90 sm:inline">
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
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-danger hover:bg-danger-bg"
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
  );
}
