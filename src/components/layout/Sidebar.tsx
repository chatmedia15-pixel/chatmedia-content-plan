import { useState } from "react";
import { Sparkles, X, Plug } from "lucide-react";
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
      {/* Header brand — lebih compact */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #2F5CFF, #7C3AED)" }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold leading-tight text-white">
              Content Plan
            </div>
            <div
              className="text-[10px] font-medium leading-tight"
              style={{ color: "#8892A6" }}
            >
              Chatmedia
            </div>
          </div>
        </div>
        {closable && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 transition hover:bg-white/10"
          >
            <X className="h-4 w-4" style={{ color: "#A6AFC3" }} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-2">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label} className={groupIdx > 0 ? "mt-3" : "mt-0.5"}>
            {/* Group label */}
            <div
              className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "#64748B" }}
            >
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
                    className="group flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all duration-150"
                    style={{
                      backgroundColor: active
                        ? "rgba(47,92,255,0.22)"
                        : hovered
                          ? "rgba(255,255,255,0.06)"
                          : "transparent",
                      color: active ? "#fff" : hovered ? "#E2E8F0" : "#A6AFC3",
                    }}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 transition-colors"
                      style={{
                        color: active
                          ? "#93B4FF"
                          : hovered
                            ? "#B0BACE"
                            : "#7A8399",
                      }}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {active && (
                      <span
                        className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: "#5B8AFF" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer AI status — compact */}
      <div
        className="border-t px-3 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="rounded-lg px-3 py-2 transition"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <Plug className="h-3.5 w-3.5" />
            Gemini AI
            <span
              className="ml-auto h-2 w-2 animate-pulse-dot rounded-full"
              style={{ backgroundColor: "#16A34A" }}
            />
          </div>
          <div
            className="mt-0.5 text-[10px] leading-tight"
            style={{ color: "#8892A6" }}
          >
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
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col md:flex"
        style={{
          backgroundColor: "#0B1220",
          borderColor: "rgba(47,92,255,0.15)",
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
            className="relative flex h-full w-72 flex-col shadow-2xl"
            style={{ backgroundColor: "#0B1220" }}
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
