import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Reset scroll position ke atas setiap kali path berubah.
 * Taruh komponen ini di dalam Router — di luar Routes.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll ke atas dengan smooth behavior
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" as ScrollBehavior,
    });
  }, [pathname]);

  return null;
}
