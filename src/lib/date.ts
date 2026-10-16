import { toDateInput } from "./format";

export function today(): string {
  return toDateInput(new Date());
}

export function thisMonthKey(): string {
  return today().slice(0, 7);
}

export function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Daftar YYYY-MM mundur dari sekarang, sebanyak n bulan */
export function lastNMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push(`${y}-${m}`);
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}
