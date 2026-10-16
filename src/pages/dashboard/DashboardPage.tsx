import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  CalendarRange,
  Film,
  Clock,
  Activity,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  Camera, // ← ganti
  Loader2,
  Zap,
} from "lucide-react";
import { Card, Pill, BrandDot, KpiCard } from "@/components/ui";
import { BRANDS, PRODUCTION_STATUSES, statusStyle } from "@/lib/constants";
import { fmtDate, fmtNum } from "@/lib/format";
import { daysUntil } from "@/lib/format";
import { thisMonthKey } from "@/lib/date";
import { useContentItems } from "@/hooks/useContentItems";
import { useInstagramSnapshots, useSyncInstagram } from "@/hooks/useInstagram";
import { useToast } from "@/hooks/useToast";

export function DashboardPage() {
  const navigate = useNavigate();
  const { push, toasts } = useToast();

  // ── Data dari Supabase via TanStack Query ──
  const contentQuery = useContentItems();
  const igQuery = useInstagramSnapshots();
  const syncIg = useSyncInstagram();

  const content = contentQuery.data ?? [];
  const igData = igQuery.data?.data ?? null;
  const igSyncedAt = igQuery.data?.syncedAt ?? null;

  // ── Filter per workflow stage ──
  const planningItems = useMemo(
    () => content.filter((c) => c.workflow_stage === "planning"),
    [content],
  );
  const calendarItems = useMemo(
    () => content.filter((c) => c.workflow_stage === "calendar"),
    [content],
  );
  const publishedItems = useMemo(
    () => content.filter((c) => c.workflow_stage === "published"),
    [content],
  );

  // ── Pipeline: hitung per production_status (dari kalender) ──
  const pipeline = useMemo(() => {
    const out: Record<string, number> = {};
    PRODUCTION_STATUSES.forEach((s) => (out[s] = 0));
    calendarItems.forEach((p) => {
      if (out[p.production_status] !== undefined) out[p.production_status]++;
    });
    return out;
  }, [calendarItems]);

  const totalPipeline = calendarItems.length;

  // ── Upcoming deadlines ──
  const upcoming = useMemo(() => {
    return calendarItems
      .filter((p) => p.planned_date)
      .map((p) => ({ ...p, _days: daysUntil(p.planned_date!) }))
      .filter((p) => p._days >= -7 && p._days <= 14)
      .sort((a, b) => a._days - b._days)
      .slice(0, 5);
  }, [calendarItems]);

  // ── Recent published ──
  const recent = useMemo(() => {
    return [...publishedItems]
      .sort(
        (a, b) =>
          new Date(b.published_at ?? b.planned_date ?? 0).getTime() -
          new Date(a.published_at ?? a.planned_date ?? 0).getTime(),
      )
      .slice(0, 4);
  }, [publishedItems]);

  // ── KPI bulan ini ──
  const monthKey = thisMonthKey();
  const publishedThisMonth = publishedItems.filter((p) =>
    p.planned_date?.startsWith(monthKey),
  ).length;
  const plannedThisMonth = planningItems.filter((p) =>
    p.planned_date?.startsWith(monthKey),
  ).length;

  // ── Greeting ──
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Selamat pagi"
      : hour < 15
        ? "Selamat siang"
        : hour < 18
          ? "Selamat sore"
          : "Selamat malam";
  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ── Handlers ──
  async function handleSyncIg() {
    try {
      await syncIg.mutateAsync(BRANDS.map((b) => b.id));
      push("Berhasil sync Instagram");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync gagal";
      push(`Sync gagal: ${msg}`);
    }
  }

  function handleRefreshIg() {
    igQuery.refetch();
    push("Data IG dimuat ulang");
  }

  // ── Loading state global ──
  const isLoading = contentQuery.isLoading;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* ── Instagram Panel ── */}
      <InstagramPanel
        data={igData}
        loading={igQuery.isLoading || syncIg.isPending}
        error={igQuery.error?.message ?? null}
        syncedAt={igSyncedAt}
        onRefresh={handleRefreshIg}
        onSync={handleSyncIg}
      />

      {/* ── Header + KPI ── */}
      <Card className="p-4 sm:p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-primary sm:text-xs">
              {todayStr}
            </div>
            <h1 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
              {greeting} 👋
            </h1>
            <p className="mt-1 text-xs text-sub sm:text-sm">
              Ringkasan content plan kamu hari ini.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => contentQuery.refetch()}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-sub transition hover:bg-slate-50 disabled:opacity-60 sm:text-sm"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin-slow" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              Muat Ulang
            </button>
            <button
              onClick={() => navigate("/ide")}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 sm:px-4 sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Buat Konten
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <KpiCard
            icon={Archive}
            label={`Dipublikasi ${new Date().toLocaleDateString("id-ID", { month: "long" }).split(" ")[0]}`}
            value={publishedThisMonth}
            iconColor="#16A34A"
            iconBg="#EAFBF1"
          />
          <KpiCard
            icon={CalendarRange}
            label="Direncanakan"
            value={plannedThisMonth}
            iconColor="#D97706"
            iconBg="#FEF6E7"
          />
          <KpiCard
            icon={Film}
            label="Sedang Produksi"
            value={calendarItems.length}
            iconColor="#2F5CFF"
            iconBg="#EEF2FF"
          />
        </div>

        {/* ── Pipeline ── */}
        <div className="border-t border-line pt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Pipeline Produksi</span>
              <span className="text-xs text-sub">({totalPipeline})</span>
            </div>
            <button
              onClick={() => navigate("/kalender")}
              className="text-xs font-medium text-primary hover:underline"
            >
              Kelola →
            </button>
          </div>

          {totalPipeline === 0 ? (
            <div className="py-4 text-center text-sm text-sub">
              Belum ada konten di pipeline.
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {PRODUCTION_STATUSES.map((s) => {
                const count = pipeline[s] ?? 0;
                const st = statusStyle(s);
                const pct =
                  totalPipeline > 0 ? (count / totalPipeline) * 100 : 0;
                return (
                  <div
                    key={s}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-slate-50/50 p-2 sm:p-3"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: st.dot }}
                      />
                      <span
                        className="truncate text-[10px] font-medium sm:text-xs"
                        style={{ color: st.fg }}
                      >
                        {s}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-ink sm:text-2xl">
                      {count}
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: st.gradient }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* ── Deadline + Recent ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-warn" />
            <span className="text-sm font-semibold">Deadline Terdekat</span>
          </div>
          {upcoming.length === 0 ? (
            <div className="py-6 text-center text-sm text-sub">
              Tidak ada deadline dalam 14 hari.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {upcoming.map((p) => {
                const isOverdue = p._days < 0;
                const isToday = p._days === 0;
                const isTomorrow = p._days === 1;
                const dayLabel = isOverdue
                  ? `${Math.abs(p._days)} hari lalu`
                  : isToday
                    ? "Hari ini"
                    : isTomorrow
                      ? "Besok"
                      : `${p._days} hari lagi`;
                const tone = isOverdue ? "bad" : isToday ? "warn" : "blue";
                const st = statusStyle(p.production_status);
                const date = p.planned_date ? new Date(p.planned_date) : null;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate("/kalender")}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 transition hover:bg-slate-50"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg"
                      style={{ backgroundColor: st.bg }}
                    >
                      <div
                        className="text-[10px] font-medium"
                        style={{ color: st.fg }}
                      >
                        {date?.toLocaleDateString("id-ID", { month: "short" })}
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: st.fg }}
                      >
                        {date?.getDate()}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium sm:text-sm">
                        {p.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <BrandDot id={p.brand_id} size={6} />
                        <span className="text-[10px] text-sub">
                          {BRANDS.find((b) => b.id === p.brand_id)?.name ??
                            p.brand_id}
                        </span>
                        <span className="text-[10px] text-sub">·</span>
                        <span className="text-[10px] text-sub">
                          {p.platform}
                        </span>
                      </div>
                    </div>
                    <Pill tone={tone} className="!px-2 !py-0.5 !text-[10px]">
                      {dayLabel}
                    </Pill>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold">Baru Dipublikasi</span>
            </div>
            <button
              onClick={() => navigate("/dipublikasi")}
              className="text-xs font-medium text-primary hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="py-6 text-center text-sm text-sub">
              Belum ada konten yang dipublikasi.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-line p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-bg">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium sm:text-sm">
                      {p.title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-sub">
                      <BrandDot id={p.brand_id} size={6} />
                      {BRANDS.find((b) => b.id === p.brand_id)?.name ??
                        p.brand_id}
                      <span>·</span>
                      {fmtDate(p.published_at ?? p.planned_date)}
                    </div>
                  </div>
                  {p.published_url && (
                    <a
                      href={p.published_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-success-bg px-2 py-1 text-[10px] font-medium text-success"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Buka
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Toast */}
      {toasts.length > 0 && <ToastInline toasts={toasts} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// INSTAGRAM PANEL — sub-component
// ══════════════════════════════════════════════════════════════

interface InstagramPanelProps {
  data: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  syncedAt: string | null;
  onRefresh: () => void;
  onSync: () => void;
}

function InstagramPanel({
  data,
  loading,
  error,
  syncedAt,
  onRefresh,
  onSync,
}: InstagramPanelProps) {
  const syncLabel = syncedAt
    ? new Date(syncedAt).toLocaleString("id-ID")
    : "Belum pernah sync";

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "linear-gradient(135deg, #E1306C, #F77737)" }}
          >
            <Camera className="h-4 w-4 text-white" />
          </div>
          <span className="truncate text-sm font-semibold">Data Instagram</span>
          <Pill tone="blue">CreatorCrawl</Pill>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium disabled:opacity-60"
          >
            {loading ? (
              <span className="spinner spinner-dark" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>
          <button
            onClick={onSync}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {loading ? (
              <span className="spinner" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Sync
          </button>
        </div>
      </div>

      <div className="mb-3 text-[10px] text-sub">
        Terakhir sync: {syncLabel}
      </div>

      {error && (
        <div className="rounded-lg bg-danger-bg p-3 text-xs text-danger">
          {error}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="py-8 text-center text-sm text-sub">
          <Camera className="mx-auto mb-2 h-8 w-8 text-line" />
          Klik Sync untuk memuat data.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-sub">
          <Loader2 className="h-4 w-4 animate-spin-slow" />
          Memuat data…
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BRANDS.map((brand) => {
            const d = data[brand.id];
            if (!d) {
              return (
                <Card key={brand.id} className="p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-sub">
                    <BrandDot id={brand.id} />
                    <span className="truncate">{brand.name}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-sub">
                    Belum ada data.
                  </div>
                </Card>
              );
            }
            return (
              <Card key={brand.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-sub">
                    <BrandDot id={brand.id} />
                    <span className="truncate">{brand.name}</span>
                  </div>
                  {d.profile_url && (
                    <a
                      href={d.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[10px] font-medium hover:underline"
                      style={{ color: "#E1306C" }}
                    >
                      @{d.username}
                    </a>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {d.avatar_url && (
                    <img
                      src={d.avatar_url}
                      alt={d.username}
                      className="h-10 w-10 shrink-0 rounded-full border-2 border-line object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-2xl font-semibold text-ink">
                      {fmtNum(d.followers)}
                    </div>
                    <div className="text-[11px] text-sub">Followers</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-bg py-1.5">
                    <div className="text-[10px] text-sub">Posts</div>
                    <div className="text-xs font-semibold">
                      {fmtNum(d.posts_count)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-bg py-1.5">
                    <div className="text-[10px] text-sub">Likes</div>
                    <div className="text-xs font-semibold">
                      {fmtNum(d.total_likes)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-bg py-1.5">
                    <div className="text-[10px] text-sub">Views</div>
                    <div className="text-xs font-semibold">
                      {fmtNum(d.total_views)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-sub">
                  <span>Avg Likes: {fmtNum(d.avg_likes)}</span>
                  <span>Avg Views: {fmtNum(d.avg_views)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// Simple inline toast — dipakai kalau tidak pakai Toast component global
function ToastInline({ toasts }: { toasts: { id: number; msg: string }[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-in rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg"
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
