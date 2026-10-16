import { useCallback, useState } from "react";
import type { ToastItem } from "@/components/ui";

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return { toasts, push };
}
