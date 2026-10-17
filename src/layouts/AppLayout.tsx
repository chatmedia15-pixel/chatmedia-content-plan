import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Reset scroll tiap pindah halaman */}
      <ScrollToTop />

      <Sidebar
        currentPath={location.pathname}
        onNavigate={navigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          currentPath={location.pathname}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 px-3 py-4 sm:px-6 sm:py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
