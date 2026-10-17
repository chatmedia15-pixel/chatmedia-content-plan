import { useMemo, useState, useRef } from "react";
import {
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Sparkles,
  Download,
  Camera as Instagram,
  Heart,
  Eye,
  Trophy,
  Activity,
  Award,
  Loader2,
  FileDown,
} from "lucide-react";
import {
  Card,
  Pill,
  KpiCard,
  Select,
  SectionHeader,
  BrandDot,
} from "@/components/ui";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { SimplePieChart } from "@/components/charts/SimplePieChart";
import { BRANDS } from "@/lib/constants";
import { fmtNum, fmtDate, monthKey, monthLabel } from "@/lib/format";
import { useContentItems } from "@/hooks/useContentItems";
import { useInstagramSnapshots } from "@/hooks/useInstagram";
import { useToast } from "@/hooks/useToast";
import { exportElementToPDF } from "@/services/pdf.service";
import type { ContentItem, SocialSnapshot } from "@/types/content";

type Tab = "laporan" | "analitik";

export function ReportsPage() {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("laporan");
  const [month, setMonth] = useState("all");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);

  const contentQuery = useContentItems();
  const igQuery = useInstagramSnapshots();

  const items = contentQuery.data ?? [];
  const igData = igQuery.data?.data ?? null;
  const igSyncedAt = igQuery.data?.syncedAt ?? null;

  // Daftar bulan
  const availableMonths = useMemo(() => {
    const months: Record<string, number> = {};
    items.forEach((it) => {
      const k = monthKey(it.planned_date);
      if (!k) return;
      months[k] = (months[k] ?? 0) + 1;
    });
    return Object.keys(months)
      .sort()
      .reverse()
      .map((k) => ({ value: k, label: monthLabel(k), count: months[k] }));
  }, [items]);

  // Filter konten
  const filtered = useMemo(() => {
    if (month === "all") return items;
    return items.filter((it) => monthKey(it.planned_date) === month);
  }, [items, month]);

  // Handler CSV
  function handleExportCSV() {
    if (filtered.length === 0) {
      push("Tidak ada data untuk diekspor");
      return;
    }

    setExporting("csv");
    try {
      const headers = [
        "Tanggal",
        "Judul",
        "Brand",
        "Platform",
        "Format",
        "Status",
        "Stage",
        "URL",
      ];
      const rows = filtered.map((it) => {
        const b = BRANDS.find((x) => x.id === it.brand_id);
        return [
          it.planned_date ?? "",
          `"${(it.title ?? "").replace(/"/g, '""')}"`,
          b?.name ?? it.brand_id,
          it.platform,
          it.format ?? "",
          it.production_status,
          it.workflow_stage,
          it.published_url ?? "",
        ].join(",");
      });
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-konten-${month === "all" ? "semua" : month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      push("CSV diekspor");
    } finally {
      setTimeout(() => setExporting(null), 300);
    }
  }

  // Handler PDF
  async function handleExportPDF() {
    console.log("[PDF] Start export, tab:", tab);
    console.log("[PDF] contentRef:", contentRef.current);
    console.log("[PDF] analyticsRef:", analyticsRef.current);

    setExporting("pdf");
    try {
      if (tab === "laporan") {
        if (!contentRef.current) {
          console.error("[PDF] contentRef NULL!");
          throw new Error("Konten belum siap — ref null");
        }
        console.log("[PDF] Starting export, element:", contentRef.current);
        await exportElementToPDF(
          contentRef.current,
          `laporan-konten-${new Date().toISOString().slice(0, 10)}`,
          "Laporan Konten Internal",
        );
      } else {
        if (!analyticsRef.current) {
          console.error("[PDF] analyticsRef NULL!");
          throw new Error("Analitik belum siap — ref null");
        }
        await exportElementToPDF(
          analyticsRef.current,
          `analitik-instagram-${new Date().toISOString().slice(0, 10)}`,
          "Analitik Instagram",
        );
      }
      console.log("[PDF] Success");
      push("PDF berhasil diekspor");
    } catch (err) {
      console.error("[PDF] Error:", err);
      push(
        `Gagal ekspor PDF: ${err instanceof Error ? err.message : "unknown"}`,
      );
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Laporan"
        desc="Ringkasan performa konten & analitik Instagram."
        action={
          <div className="flex flex-wrap gap-2">
            {tab === "laporan" && (
              <Select
                value={month}
                onChange={setMonth}
                options={[
                  { value: "all", label: "Semua Bulan" },
                  ...availableMonths.map((m) => ({
                    value: m.value,
                    label: m.label,
                  })),
                ]}
              />
            )}

            {tab === "laporan" && (
              <button
                onClick={handleExportCSV}
                disabled={exporting !== null}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-sub transition hover:bg-slate-50 disabled:opacity-60"
              >
                {exporting === "csv" ? (
                  <Loader2 className="h-4 w-4 animate-spin-slow" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                CSV
              </button>
            )}

            <button
              onClick={handleExportPDF}
              disabled={exporting !== null}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin-slow" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Ekspor PDF
            </button>
          </div>
        }
      />

      {/* Tab navigation */}
      <Card className="p-3 sm:p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("laporan")}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition"
            style={{
              backgroundColor: tab === "laporan" ? "#EEF2FF" : "transparent",
              color: tab === "laporan" ? "#2F5CFF" : "#5B6478",
              border: `1px solid ${tab === "laporan" ? "#2F5CFF" : "#E7E9F0"}`,
            }}
          >
            <FileText className="h-4 w-4" />
            Laporan Konten
          </button>
          <button
            onClick={() => setTab("analitik")}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition"
            style={{
              backgroundColor: tab === "analitik" ? "#F5F3FF" : "transparent",
              color: tab === "analitik" ? "#7C3AED" : "#5B6478",
              border: `1px solid ${tab === "analitik" ? "#7C3AED" : "#E7E9F0"}`,
            }}
          >
            <Instagram className="h-4 w-4" />
            Analitik Instagram
          </button>
        </div>
      </Card>

      {/* Tab Content */}
      {tab === "laporan" && (
        <div ref={contentRef} className="flex flex-col gap-5">
          <LaporanTab items={filtered} />
        </div>
      )}

      {tab === "analitik" && (
        <div ref={analyticsRef} className="flex flex-col gap-5">
          <AnalitikTab
            igData={igData}
            syncedAt={igSyncedAt}
            isLoading={igQuery.isLoading}
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 1: Laporan Konten
// ═══════════════════════════════════════════════════════════
function LaporanTab({ items }: { items: ContentItem[] }) {
  const kpi = useMemo(() => {
    const total = items.length;
    const published = items.filter(
      (it) => it.workflow_stage === "published",
    ).length;
    const planning = items.filter(
      (it) => it.workflow_stage === "planning",
    ).length;
    const calendar = items.filter(
      (it) => it.workflow_stage === "calendar",
    ).length;

    const brandCount: Record<string, number> = {};
    items
      .filter((it) => it.workflow_stage === "published")
      .forEach((it) => {
        brandCount[it.brand_id] = (brandCount[it.brand_id] ?? 0) + 1;
      });
    const topBrandId = Object.entries(brandCount).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const topBrand = BRANDS.find((b) => b.id === topBrandId)?.name ?? "-";

    const formatCount: Record<string, number> = {};
    items.forEach((it) => {
      if (!it.format) return;
      formatCount[it.format] = (formatCount[it.format] ?? 0) + 1;
    });
    const topFormat =
      Object.entries(formatCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    return { total, published, planning, calendar, topBrand, topFormat };
  }, [items]);

  const byBrand = useMemo(() => {
    const g: Record<string, number> = {};
    items.forEach((it) => {
      const b = BRANDS.find((x) => x.id === it.brand_id);
      const name = b?.name ?? it.brand_id;
      g[name] = (g[name] ?? 0) + 1;
    });
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [items]);

  const byStatus = useMemo(() => {
    const g: Record<string, number> = {};
    items.forEach((it) => {
      g[it.production_status] = (g[it.production_status] ?? 0) + 1;
    });
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [items]);

  const byMonth = useMemo(() => {
    const g: Record<string, number> = {};
    items.forEach((it) => {
      const k = monthKey(it.planned_date);
      if (!k) return;
      g[k] = (g[k] ?? 0) + 1;
    });
    return Object.entries(g)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([k, value]) => ({
        name: monthLabel(k).split(" ")[0].substring(0, 3),
        value,
      }));
  }, [items]);

  const recentContent = useMemo(() => {
    return [...items]
      .filter((it) => it.workflow_stage === "published")
      .sort((a, b) => {
        const da = a.published_at ?? a.planned_date ?? "";
        const db = b.published_at ?? b.planned_date ?? "";
        return db.localeCompare(da);
      })
      .slice(0, 5);
  }, [items]);

  return (
    <div className="flex flex-col gap-5">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <KpiCard
          icon={BarChart3}
          label="Total"
          value={kpi.total}
          sub="Semua sumber"
          iconColor="#2F5CFF"
          iconBg="#EEF2FF"
        />
        <KpiCard
          icon={TrendingUp}
          label="Dipublikasi"
          value={kpi.published}
          sub={`${kpi.total > 0 ? Math.round((kpi.published / kpi.total) * 100) : 0}% dari total`}
          iconColor="#16A34A"
          iconBg="#EAFBF1"
        />
        <KpiCard
          icon={Users}
          label="Brand Terbaik"
          value={kpi.topBrand}
          sub="Paling banyak publish"
          iconColor="#D97706"
          iconBg="#FEF6E7"
        />
        <KpiCard
          icon={Sparkles}
          label="Format Terbaik"
          value={kpi.topFormat}
          sub="Paling sering dipakai"
          iconColor="#7C3AED"
          iconBg="#F5F3FF"
        />
      </div>

      {/* Distribusi Stage */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="mb-2 text-xs text-sub">Perencanaan</div>
          <div className="text-2xl font-bold text-warn">{kpi.planning}</div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 text-xs text-sub">Kalender</div>
          <div className="text-2xl font-bold text-primary">{kpi.calendar}</div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 text-xs text-sub">Dipublikasi</div>
          <div className="text-2xl font-bold text-success">{kpi.published}</div>
        </Card>
      </div>

      {/* Charts baris 1 */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="flex h-[340px] flex-col p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm font-semibold">Konten per Brand</span>
              </div>
              <Pill tone="blue">{byBrand.length} brand</Pill>
            </div>
            <div className="flex-1">
              <SimpleBarChart data={byBrand} formatY={fmtNum} />
            </div>
          </Card>

          <Card className="flex h-[340px] flex-col p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-ai" />
              <span className="text-sm font-semibold">
                Distribusi Status Produksi
              </span>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <SimplePieChart data={byStatus} size={200} />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">
            Belum ada data untuk periode ini
          </div>
          <p className="mt-1 text-xs text-sub">
            Coba pilih bulan lain, atau tambahkan konten dulu.
          </p>
        </Card>
      )}

      {/* Charts baris 2 */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="flex h-[340px] flex-col p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                Tren Konten 12 Bulan
              </span>
            </div>
            <div className="flex-1">
              {byMonth.length > 0 ? (
                <SimpleBarChart data={byMonth} formatY={fmtNum} />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-sub">
                  Belum ada data tren
                </div>
              )}
            </div>
          </Card>

          <Card className="flex h-[340px] flex-col p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-warn" />
                <span className="text-sm font-semibold">
                  Top 5 Konten Terbaru
                </span>
              </div>
              <Pill tone="good">{recentContent.length} konten</Pill>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {recentContent.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-sub">
                  Belum ada konten dipublikasi
                </div>
              ) : (
                recentContent.map((it) => {
                  const brand = BRANDS.find((b) => b.id === it.brand_id);
                  return (
                    <div
                      key={it.id}
                      className="flex shrink-0 items-center gap-2 rounded-lg border border-line p-2"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-success-bg">
                        <TrendingUp className="h-3.5 w-3.5 text-success" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-medium text-ink">
                          {it.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[9px] text-sub">
                          <BrandDot id={it.brand_id} size={5} />
                          {brand?.name}
                          <span>·</span>
                          {fmtDate(it.published_at ?? it.planned_date)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tabel ringkasan */}
      {items.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <FileText className="h-4 w-4 text-sub" />
            <span className="text-sm font-semibold">Ringkasan per Brand</span>
          </div>
          <div className="overflow-x-auto">
            <table
              className="w-full text-left text-sm"
              style={{ minWidth: 600 }}
            >
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-wide text-sub">
                  <th className="px-4 py-3 font-semibold">Brand</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Planning</th>
                  <th className="px-4 py-3 font-semibold">Kalender</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                </tr>
              </thead>
              <tbody>
                {BRANDS.map((b) => {
                  const brandItems = items.filter((it) => it.brand_id === b.id);
                  const total = brandItems.length;
                  const planning = brandItems.filter(
                    (it) => it.workflow_stage === "planning",
                  ).length;
                  const calendar = brandItems.filter(
                    (it) => it.workflow_stage === "calendar",
                  ).length;
                  const published = brandItems.filter(
                    (it) => it.workflow_stage === "published",
                  ).length;
                  return (
                    <tr
                      key={b.id}
                      className="border-t border-line hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <BrandDot id={b.id} />
                          <span className="font-medium">{b.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{total}</td>
                      <td className="px-4 py-3 text-warn">{planning}</td>
                      <td className="px-4 py-3 text-primary">{calendar}</td>
                      <td className="px-4 py-3 text-success">{published}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab 2: Analitik Instagram
// ═══════════════════════════════════════════════════════════
function AnalitikTab({
  igData,
  syncedAt,
  isLoading,
}: {
  igData: Record<string, SocialSnapshot> | null;
  syncedAt: string | null;
  isLoading: boolean;
}) {
  const brands = useMemo(() => {
    if (!igData) return [];
    return BRANDS.map((b) => {
      const snap = igData[b.id];
      if (!snap) return null;

      const followers = snap.followers ?? 0;
      const avgLikes = snap.avg_likes ?? 0;
      const totalLikes = snap.total_likes ?? 0;
      const totalViews = snap.total_views ?? 0;

      return {
        id: b.id,
        name: b.name,
        color: b.color,
        username: snap.username ?? "",
        avatar: snap.avatar_url ?? "",
        followers,
        posts: snap.posts_count ?? 0,
        totalLikes,
        totalViews,
        avgLikes,
        avgViews: snap.avg_views ?? 0,
        engagementRate: followers > 0 ? (avgLikes / followers) * 100 : 0,
        likeViewRatio: totalViews > 0 ? (totalLikes / totalViews) * 100 : 0,
      };
    }).filter(Boolean) as Array<{
      id: string;
      name: string;
      color: string;
      username: string;
      avatar: string;
      followers: number;
      posts: number;
      totalLikes: number;
      totalViews: number;
      avgLikes: number;
      avgViews: number;
      engagementRate: number;
      likeViewRatio: number;
    }>;
  }, [igData]);

  const allPosts = useMemo(() => {
    if (!igData) return [];
    const out: Array<{
      brandId: string;
      brandName: string;
      brandColor: string;
      url?: string;
      caption?: string;
      likes: number;
      views: number;
      type: "reel" | "post";
      engagementRate: number;
      likeViewRatio: number;
    }> = [];

    BRANDS.forEach((brand) => {
      const snap = igData[brand.id];
      if (!snap) return;

      const followers = snap.followers ?? 0;
      const recentPosts = snap.recent_posts ?? [];

      recentPosts.forEach((p) => {
        const likes = p.likes ?? 0;
        const views = p.views ?? 0;

        out.push({
          brandId: brand.id,
          brandName: brand.name,
          brandColor: brand.color,
          url: p.url,
          caption: p.caption,
          likes,
          views,
          type: p.type === "reel" ? "reel" : "post",
          engagementRate:
            followers > 0 ? ((likes + views) / followers) * 100 : 0,
          likeViewRatio: views > 0 ? (likes / views) * 100 : 0,
        });
      });
    });

    return out;
  }, [igData]);

  const [postCategory, setPostCategory] = useState<
    "views" | "likes" | "engagement" | "quality"
  >("views");

  const totals = useMemo(() => {
    const t = {
      followers: 0,
      posts: 0,
      likes: 0,
      views: 0,
      brands: brands.length,
    };
    brands.forEach((b) => {
      t.followers += b.followers;
      t.posts += b.posts;
      t.likes += b.totalLikes;
      t.views += b.totalViews;
    });
    return t;
  }, [brands]);

  const chartFollowers = brands.map((b) => ({
    name: b.name.split(" ")[0],
    value: b.followers,
  }));

  const chartAvgViews = brands.map((b) => ({
    name: b.name.split(" ")[0],
    value: b.avgViews,
  }));

  const ranked = [...brands].sort(
    (a, b) => b.engagementRate - a.engagementRate,
  );

  const categories = [
    {
      id: "views" as const,
      label: "Top Views",
      emoji: "👁️",
      color: "#2F5CFF",
      bg: "#EEF2FF",
      getValue: (p: (typeof allPosts)[0]) => p.views,
      format: (v: number) => `${fmtNum(v)} views`,
    },
    {
      id: "likes" as const,
      label: "Top Likes",
      emoji: "❤️",
      color: "#16A34A",
      bg: "#EAFBF1",
      getValue: (p: (typeof allPosts)[0]) => p.likes,
      format: (v: number) => `${fmtNum(v)} likes`,
    },
    {
      id: "engagement" as const,
      label: "Best Engagement",
      emoji: "🔥",
      color: "#DC2626",
      bg: "#FDECEC",
      getValue: (p: (typeof allPosts)[0]) => p.engagementRate,
      format: (v: number) => `${v.toFixed(2)}% ER`,
    },
    {
      id: "quality" as const,
      label: "Best Quality",
      emoji: "💎",
      color: "#7C3AED",
      bg: "#F5F3FF",
      getValue: (p: (typeof allPosts)[0]) => p.likeViewRatio,
      format: (v: number) => `${v.toFixed(1)}% L/V`,
    },
  ];

  const activeCategory = categories.find((c) => c.id === postCategory)!;

  const topPosts = useMemo(() => {
    return [...allPosts]
      .sort((a, b) => activeCategory.getValue(b) - activeCategory.getValue(a))
      .slice(0, 5);
  }, [allPosts, activeCategory]);

  const maxPostValue =
    topPosts.length > 0 ? activeCategory.getValue(topPosts[0]) : 1;

  if (isLoading) {
    return <Card className="p-12 text-center text-sm text-sub">Memuat…</Card>;
  }

  if (!igData || brands.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Instagram className="mx-auto mb-3 h-10 w-10 text-line" />
        <div className="text-sm font-semibold text-ink">
          Belum ada data Instagram
        </div>
        <p className="mt-1 text-xs text-sub">
          Klik Sync di Beranda atau Analitik untuk mengambil data.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Instagram className="h-4 w-4" style={{ color: "#E1306C" }} />
            <span className="font-medium">
              {syncedAt
                ? `Sync terakhir: ${new Date(syncedAt).toLocaleString("id-ID")}`
                : "Belum pernah sync"}
            </span>
          </div>
          <Pill tone="blue">{brands.length} brand</Pill>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Total Followers"
          value={fmtNum(totals.followers)}
          sub={`${totals.brands} brand aktif`}
          iconColor="#E1306C"
          iconBg="#FCE7F3"
        />
        <KpiCard
          icon={Instagram}
          label="Total Posts"
          value={fmtNum(totals.posts)}
          sub={`Rata-rata ${Math.round(totals.posts / totals.brands)}/brand`}
          iconColor="#2F5CFF"
          iconBg="#EEF2FF"
        />
        <KpiCard
          icon={Heart}
          label="Total Likes"
          value={fmtNum(totals.likes)}
          sub="Dari recent posts"
          iconColor="#16A34A"
          iconBg="#EAFBF1"
        />
        <KpiCard
          icon={Eye}
          label="Total Views"
          value={fmtNum(totals.views)}
          sub="Dari recent posts"
          iconColor="#7C3AED"
          iconBg="#F5F3FF"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex h-[340px] flex-col p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm font-semibold">Followers per Brand</span>
          </div>
          <div className="flex-1">
            <SimpleBarChart data={chartFollowers} formatY={fmtNum} />
          </div>
        </Card>

        <Card className="flex h-[340px] flex-col p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-sm font-semibold">
              Rata-rata Views per Brand
            </span>
          </div>
          <div className="flex-1">
            <SimpleBarChart data={chartAvgViews} formatY={fmtNum} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex h-[400px] flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warn" />
              <span className="text-sm font-semibold">Ranking Engagement</span>
            </div>
            <Pill tone="warn">Benchmark 1.5%</Pill>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {ranked.map((b, idx) => {
              const medal =
                idx === 0
                  ? "🥇"
                  : idx === 1
                    ? "🥈"
                    : idx === 2
                      ? "🥉"
                      : `#${idx + 1}`;
              const pct = Math.min((b.engagementRate / 5) * 100, 100);
              return (
                <div key={b.id} className="shrink-0">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{medal}</span>
                      <BrandDot id={b.id} size={6} />
                      <span className="truncate text-xs font-medium text-ink">
                        {b.name}
                      </span>
                    </div>
                    <span
                      className="shrink-0 text-xs font-bold"
                      style={{ color: b.color }}
                    >
                      {b.engagementRate.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: b.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex h-[400px] flex-col overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <span className="text-sm font-semibold">Ringkasan Metrik</span>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-[10px] uppercase tracking-wide text-sub">
                  <th className="px-3 py-2 font-semibold">Brand</th>
                  <th className="px-3 py-2 font-semibold">Followers</th>
                  <th className="px-3 py-2 font-semibold">Avg Likes</th>
                  <th className="px-3 py-2 font-semibold">ER</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((b) => (
                  <tr
                    key={b.id}
                    className="border-t border-line hover:bg-slate-50"
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        <BrandDot id={b.id} size={6} />
                        <span className="truncate text-[11px] font-medium">
                          {b.name}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2 font-semibold">
                      {fmtNum(b.followers)}
                    </td>
                    <td className="px-3 py-2">{fmtNum(b.avgLikes)}</td>
                    <td className="px-3 py-2">
                      <span
                        className="inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor:
                            b.engagementRate >= 1.5 ? "#EAFBF1" : "#FEF6E7",
                          color:
                            b.engagementRate >= 1.5 ? "#16A34A" : "#D97706",
                        }}
                      >
                        {b.engagementRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* POST MENARIK */}
      {allPosts.length > 0 && (
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-warn" />
              <span className="text-sm font-semibold">
                Post Menarik dari Berbagai Segi
              </span>
              <Pill tone="neutral">{allPosts.length} post</Pill>
            </div>
            <Pill tone="warn">Top 5 per kategori</Pill>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const active = postCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setPostCategory(cat.id)}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition"
                  style={{
                    borderColor: active ? cat.color : "#E7E9F0",
                    backgroundColor: active ? cat.bg : "transparent",
                    color: active ? cat.color : "#5B6478",
                  }}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            {topPosts.map((post, idx) => {
              const value = activeCategory.getValue(post);
              const pct = maxPostValue > 0 ? (value / maxPostValue) * 100 : 0;
              const isTop3 = idx < 3;
              const medal =
                idx === 0
                  ? "🥇"
                  : idx === 1
                    ? "🥈"
                    : idx === 2
                      ? "🥉"
                      : `#${idx + 1}`;

              return (
                <a
                  key={`${post.brandId}-${idx}`}
                  href={post.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col gap-1.5 rounded-xl border border-line p-2.5 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: isTop3
                          ? `${post.brandColor}20`
                          : "#F1F3F9",
                        color: isTop3 ? post.brandColor : "#5B6478",
                      }}
                    >
                      {medal}
                    </span>
                    <BrandDot id={post.brandId} size={6} />
                    <span className="truncate text-[10px] font-medium text-sub">
                      {post.brandName}
                    </span>
                    <span
                      className="ml-auto shrink-0 text-[11px] font-bold"
                      style={{ color: activeCategory.color }}
                    >
                      {activeCategory.format(value)}
                    </span>
                  </div>

                  <div className="line-clamp-2 pl-8 text-[11px] text-ink">
                    {post.caption || "(tanpa caption)"}
                  </div>

                  <div className="flex items-center gap-3 pl-8 text-[10px] text-sub">
                    <span className="inline-flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" />
                      {fmtNum(post.views)}
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Heart className="h-2.5 w-2.5" />
                      {fmtNum(post.likes)}
                    </span>
                    <span
                      className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium"
                      style={{
                        backgroundColor:
                          post.likeViewRatio >= 5 ? "#EAFBF1" : "#FEF6E7",
                        color: post.likeViewRatio >= 5 ? "#16A34A" : "#D97706",
                      }}
                    >
                      L/V {post.likeViewRatio.toFixed(1)}%
                    </span>
                    <span className="ml-auto text-[9px] uppercase">
                      {post.type}
                    </span>
                  </div>

                  <div className="h-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: activeCategory.color,
                      }}
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
