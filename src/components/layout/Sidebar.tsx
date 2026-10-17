import { useState } from "react";
import { X, Plug } from "lucide-react";
import { NAV_GROUPS } from "@/lib/constants";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function SidebarContent({
  currentPath,
  onNavigate,
  closable,
  onClose,
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
  closable?: boolean;
  onClose?: () => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col">
      {/* ── Header brand — LEBIH BESAR ── */}
      <div className="flex items-center justify-between px-3.5 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo-chat.jpeg"
            alt="Chatmedia Logo"
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
          />
          <div className="min-w-0">
            <div className="truncate text-base font-bold leading-tight text-white">
              Content Plan
            </div>
            <div className="truncate text-xs font-medium leading-tight text-white/70">
              Chatmedia
            </div>
          </div>
        </div>
        {closable && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 transition hover:bg-white/10"
          >
            <X className="h-5 w-5 text-white/80" />
          </button>
        )}
      </div>

      {/* Garis pemisah di bawah header */}
      <div
        className="mx-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
      />

      {/* Nav */}
      <nav className="flex-1 px-3 pb-2 pt-3">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx > 0 ? "mt-3" : "mt-0"}>
            {/* Group label */}
            <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
              {group.label}
            </div>

            {/* Items */}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = currentPath === item.path;
                const hovered = hoveredId === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.path)}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-white transition-all duration-150"
                    style={{
                      backgroundColor: active
                        ? "rgba(255,255,255,0.14)"
                        : hovered
                          ? "rgba(255,255,255,0.06)"
                          : "transparent",
                      opacity: active ? 1 : hovered ? 1 : 0.85,
                    }}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 text-white transition-colors"
                      style={{
                        opacity: active ? 1 : 0.85,
                      }}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer AI status */}
      <div
        className="border-t px-3 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.10)" }}
      >
        <div
          className="rounded-lg px-3 py-2 transition"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <Plug className="h-3.5 w-3.5" />
            Gemini AI
            <span
              className="ml-auto h-2 w-2 animate-pulse-dot rounded-full"
              style={{ backgroundColor: "#16A34A" }}
            />
          </div>
          <div className="mt-0.5 text-[10px] leading-tight text-white/70">
            Terhubung
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  currentPath,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r md:flex"
        style={{
          backgroundColor: "#1d1b27",
          borderColor: "rgba(124,58,237,0.15)",
        }}
      >
        <SidebarContent currentPath={currentPath} onNavigate={onNavigate} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[95] flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
          />
          <aside
            className="relative flex h-full w-72 flex-col border-r shadow-2xl"
            style={{
              backgroundColor: "#1d1b27",
              borderColor: "rgba(124,58,237,0.15)",
            }}
          >
            <SidebarContent
              currentPath={currentPath}
              onNavigate={(p) => {
                onNavigate(p);
                onCloseMobile?.();
              }}
              closable
              onClose={onCloseMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
}
