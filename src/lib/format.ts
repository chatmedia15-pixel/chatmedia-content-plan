import { BRAND_MAP } from "./constants";

// ── Angka ──────────────────────────────────────────────
export function fmtNum(n: number | null | undefined): string {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "Jt";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(Math.round(v));
}

export function fmtPercent(n: number, digits = 2): string {
  return `${n.toFixed(digits)}%`;
}

// ── Tanggal ────────────────────────────────────────────
export function fmtDate(
  dateStr: string | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions,
): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(
    "id-ID",
    opts ?? { day: "2-digit", month: "short", year: "numeric" },
  );
}

/** YYYY-MM-DD dari Date lokal (bukan UTC) */
export function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Ambil YYYY-MM dari YYYY-MM-DD */
export function monthKey(dateStr: string | null | undefined): string {
  return dateStr ? dateStr.slice(0, 7) : "";
}

/** "Oktober 2026" dari "2026-10" */
export function monthLabel(key: string): string {
  if (!key) return "-";
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/** Selisih hari (target - today). Negatif = lewat. */
export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

/** "Hari ini", "Besok", "3 hari lalu", dst. */
export function relativeDay(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d === 0) return "Hari ini";
  if (d === 1) return "Besok";
  if (d < 0) return `${Math.abs(d)} hari lalu`;
  return `${d} hari lagi`;
}

// ── Brand ──────────────────────────────────────────────
export function brandColor(id: string): string {
  return BRAND_MAP[id]?.color ?? "#94A3B8";
}

export function brandName(id: string): string {
  return BRAND_MAP[id]?.name ?? id;
}

// ── Classnames ─────────────────────────────────────────
export function cx(...args: (string | false | null | undefined)[]): string {
  return args.filter(Boolean).join(" ");
}

// ── Validasi URL ───────────────────────────────────────
export function isValidUrl(s: string): boolean {
  if (!s.trim()) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
/** Format tanggal panjang Indonesia: "Senin, 19 Oktober 2026" */
export function fmtDateFull(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Cek apakah tanggal = hari ini */
export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return d.getTime() === today.getTime();
}

/** Cek apakah tanggal < hari ini (overdue) */
export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return d.getTime() < today.getTime();
}
