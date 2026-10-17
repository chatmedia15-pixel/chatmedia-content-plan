import { useMemo, useState } from "react";
import {
  Camera as Instagram,
  Users,
  Heart,
  Eye,
  TrendingUp,
  Film,
  ExternalLink,
  RefreshCw,
  Loader2,
  Target,
  List,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { Card, Pill, BrandDot, KpiCard, Select } from "@/components/ui";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { SimplePieChart } from "@/components/charts/SimplePieChart";
import { BRANDS } from "@/lib/constants";
import { fmtNum } from "@/lib/format";
import { useInstagramSnapshots, useSyncInstagram } from "@/hooks/useInstagram";
import { useToast } from "@/hooks/useToast";
import type { SocialSnapshot } from "@/types/content";

// ─────────────────────────────────────────────────────────
// Tipe data turunan
// ─────────────────────────────────────────────────────────
interface IgBrand {
  id: string;
  name: string;
  shortName: string;
  color: string;
  username: string;
  url: string;
  avatar: string;
  verified: boolean;
  success: boolean;
  followers: number;
  posts: number;
  totalLikes: number;
  totalViews: number;
  avgLikes: number;
  avgViews: number;
  engagementRate: number;
  likeViewRatio: number;
  recentPosts: Array<{
    url?: string;
    caption?: string;
    likes?: number;
    views?: number;
    type?: "reel" | "post";
  }>;
}

interface PostWithBrand {
  brandId: string;
  brandName: string;
  brandColor: string;
  brandUsername: string;
  url?: string;
  caption?: string;
  likes: number;
  views: number;
  type: "reel" | "post";
  engagementRate: number; // likes + views / follower ratio proxy
  likeViewRatio: number; // likes / views ratio
}

type IgTab = "overview" | "comparison" | "posts";

// ─────────────────────────────────────────────────────────
// Komponen utama
// ─────────────────────────────────────────────────────────
export function InstagramPanel() {
  const { push } = useToast();

  const query = useInstagramSnapshots();
  const syncMut = useSyncInstagram();

  const [tab, setTab] = useState<IgTab>("overview");
  const [sortBy, setSortBy] = useState<keyof IgBrand>("followers");

  const snapshots = query.data?.data ?? null;
  const syncedAt = query.data?.syncedAt ?? null;

  // ── Konversi snapshot → IgBrand ──────────────
  const igBrands = useMemo<IgBrand[]>(() => {
    if (!snapshots) return [];
    return Object.entries(snapshots).map(([brandId, s]) => {
      const snap = s as SocialSnapshot;
      const brand = BRANDS.find((b) => b.id === brandId);
      const followers = snap.followers ?? 0;
      const avgLikes = snap.avg_likes ?? 0;
      const totalLikes = snap.total_likes ?? 0;
      const totalViews = snap.total_views ?? 0;
      return {
        id: brandId,
        name: brand?.name ?? brandId,
        shortName: brand?.name.split(" ")[0] ?? brandId,
        color: brand?.color ?? "#999",
        username: snap.username ?? "",
        url: snap.profile_url ?? "",
        avatar: snap.avatar_url ?? "",
        verified: snap.is_verified ?? false,
        success: snap.sync_status !== "failed",
        followers,
        posts: snap.posts_count ?? 0,
        totalLikes,
        totalViews,
        avgLikes,
        avgViews: snap.avg_views ?? 0,
        engagementRate: followers > 0 ? (avgLikes / followers) * 100 : 0,
        likeViewRatio: totalViews > 0 ? (totalLikes / totalViews) * 100 : 0,
        recentPosts: snap.recent_posts ?? [],
      };
    });
  }, [snapshots]);

  const validBrands = useMemo(
    () => igBrands.filter((b) => b.success),
    [igBrands],
  );

  // ── Total agregat ────────────────────────────
  const totals = useMemo(() => {
    const t = {
      followers: 0,
      posts: 0,
      likes: 0,
      views: 0,
      brands: validBrands.length,
      avgLikes: 0,
      avgViews: 0,
      avgER: 0,
    };
    validBrands.forEach((b) => {
      t.followers += b.followers;
      t.posts += b.posts;
      t.likes += b.totalLikes;
      t.views += b.totalViews;
      t.avgLikes += b.avgLikes;
      t.avgViews += b.avgViews;
      t.avgER += b.engagementRate;
    });
    if (t.brands > 0) {
      t.avgLikes = t.avgLikes / t.brands;
      t.avgViews = t.avgViews / t.brands;
      t.avgER = t.avgER / t.brands;
    }
    return t;
  }, [validBrands]);

  // ── Insights otomatis ────────────────────────
  const insights = useMemo(() => {
    if (validBrands.length === 0) return [];
    const out: {
      tone: "good" | "warn" | "blue" | "neutral";
      icon: string;
      title: string;
      text: string;
    }[] = [];

    const sorted = [...validBrands].sort((a, b) => b.followers - a.followers);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best && worst && best.id !== worst.id && worst.followers > 0) {
      const pct = Math.round((best.followers / worst.followers - 1) * 100);
      out.push({
        tone: "good",
        icon: "🏆",
        title: "Pemimpin Followers",
        text: `${best.name} (${fmtNum(best.followers)}) — ${pct}% lebih tinggi dari ${worst.name}`,
      });
    }

    const bestER = [...validBrands].sort(
      (a, b) => b.engagementRate - a.engagementRate,
    )[0];
    if (bestER) {
      const status =
        bestER.engagementRate >= 3
          ? "sangat baik"
          : bestER.engagementRate >= 1.5
            ? "sehat"
            : "perlu ditingkatkan";
      out.push({
        tone: bestER.engagementRate >= 1.5 ? "good" : "warn",
        icon: "💡",
        title: "Engagement Tertinggi",
        text: `${bestER.name} (${bestER.engagementRate.toFixed(2)}%, ${status})`,
      });
    }

    const lowLVR = [...validBrands]
      .filter((b) => b.totalViews > 0)
      .sort((a, b) => a.likeViewRatio - b.likeViewRatio)[0];
    if (lowLVR && lowLVR.likeViewRatio < 5) {
      out.push({
        tone: "warn",
        icon: "⚠️",
        title: "Perlu Optimasi Konten",
        text: `${lowLVR.name} — rasio like/view ${lowLVR.likeViewRatio.toFixed(1)}%`,
      });
    }

    const mostPosts = [...validBrands].sort((a, b) => b.posts - a.posts)[0];
    if (mostPosts) {
      out.push({
        tone: "blue",
        icon: "📊",
        title: "Paling Produktif",
        text: `${mostPosts.name} (${mostPosts.posts} posts, ${fmtNum(mostPosts.avgLikes)} avg likes)`,
      });
    }

    out.push({
      tone: "neutral",
      icon: "📈",
      title: "Total Jangkauan",
      text: `${fmtNum(totals.views)} views · ${fmtNum(totals.likes)} likes · ${totals.posts} konten · ${totals.brands} brand`,
    });

    return out;
  }, [validBrands, totals]);

  // ── Kumpulkan semua post dari semua brand ────
  const allPosts = useMemo<PostWithBrand[]>(() => {
    const out: PostWithBrand[] = [];
    validBrands.forEach((b) => {
      b.recentPosts.forEach((p) => {
        const likes = p.likes ?? 0;
        const views = p.views ?? 0;
        out.push({
          brandId: b.id,
          brandName: b.name,
          brandColor: b.color,
          brandUsername: b.username,
          url: p.url,
          caption: p.caption,
          likes,
          views,
          type: p.type === "reel" ? "reel" : "post",
          engagementRate:
            b.followers > 0 ? ((likes + views) / b.followers) * 100 : 0,
          likeViewRatio: views > 0 ? (likes / views) * 100 : 0,
        });
      });
    });
    return out;
  }, [validBrands]);

  // ── Charts data ──────────────────────────────
  const chartFollowers = validBrands.map((b) => ({
    name: b.shortName,
    value: b.followers,
  }));
  const chartAvgLikes = validBrands.map((b) => ({
    name: b.shortName,
    value: b.avgLikes,
  }));
  const chartViewsPie = validBrands.map((b) => ({
    name: b.name,
    value: b.totalViews,
  }));

  // ── Ranking ──────────────────────────────────
  const ranked = useMemo(
    () =>
      [...validBrands].sort(
        (a, b) => (Number(b[sortBy]) || 0) - (Number(a[sortBy]) || 0),
      ),
    [validBrands, sortBy],
  );

  // ── Sync handler ─────────────────────────────
  async function handleSync() {
    try {
      await syncMut.mutateAsync(undefined);
      push("Berhasil sync Instagram");
    } catch (err) {
      push(`Sync gagal: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  function handleRefresh() {
    query.refetch();
    push("Data dimuat ulang");
  }

  // ─────────────────────────────────────────────
  // Loading awal
  // ─────────────────────────────────────────────
  if (query.isLoading) {
    return (
      <Card className="p-8 text-center text-sm text-sub">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin-slow text-primary" />
        Memuat data Instagram…
      </Card>
    );
  }

  // ─────────────────────────────────────────────
  // Empty state — belum ada data
  // ─────────────────────────────────────────────
  if (!snapshots || validBrands.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #E1306C20, #F7773720)",
          }}
        >
          <Instagram className="h-7 w-7" style={{ color: "#E1306C" }} />
        </div>
        <div className="text-sm font-semibold text-ink">
          Data Instagram belum tersedia
        </div>
        <p className="mt-1 text-xs text-sub">
          Klik Sync untuk mengambil data dari CreatorCrawl.
        </p>
        <button
          onClick={handleSync}
          disabled={syncMut.isPending}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {syncMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin-slow" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync Sekarang
        </button>
      </Card>
    );
  }

  // ─────────────────────────────────────────────
  // Konten utama
  // ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Header panel */}
      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #E1306C, #F77737)",
              }}
            >
              <Instagram className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink sm:text-base">
                Analitik Instagram
              </div>
              <div className="truncate text-[10px] text-sub sm:text-xs">
                {syncedAt
                  ? `Sync: ${new Date(syncedAt).toLocaleString("id-ID")}`
                  : "Belum pernah sync"}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Pill tone="blue">{totals.brands} brand</Pill>
            <button
              onClick={handleRefresh}
              disabled={query.isFetching}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium disabled:opacity-60"
            >
              {query.isFetching ? (
                <span className="spinner spinner-dark" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Refresh
            </button>
            <button
              onClick={handleSync}
              disabled={syncMut.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
            >
              {syncMut.isPending ? (
                <span className="spinner" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync
            </button>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "overview" as IgTab, label: "Overview", icon: TrendingUp },
            { id: "comparison" as IgTab, label: "Perbandingan", icon: Target },
            { id: "posts" as IgTab, label: "Post Terbaru", icon: Film },
          ].map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition"
                style={{
                  borderColor: active ? "#2F5CFF" : "#E7E9F0",
                  backgroundColor: active ? "#EEF2FF" : "white",
                  color: active ? "#2F5CFF" : "#5B6478",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Tab content */}
      {tab === "overview" && (
        <OverviewTab
          totals={totals}
          insights={insights}
          chartFollowers={chartFollowers}
          chartAvgLikes={chartAvgLikes}
          chartViewsPie={chartViewsPie}
          allPosts={allPosts}
        />
      )}

      {tab === "comparison" && (
        <ComparisonTab
          ranked={ranked}
          sortBy={sortBy}
          onSortChange={(v) => setSortBy(v)}
        />
      )}

      {tab === "posts" && <PostsTab brands={validBrands} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Tab: Overview
// ─────────────────────────────────────────────────────────
function OverviewTab({
  totals,
  insights,
  chartFollowers,
  chartAvgLikes,
  chartViewsPie,
  allPosts,
}: {
  totals: {
    followers: number;
    posts: number;
    likes: number;
    views: number;
    brands: number;
    avgLikes: number;
    avgViews: number;
    avgER: number;
  };
  insights: Array<{ tone: string; icon: string; title: string; text: string }>;
  chartFollowers: { name: string; value: number }[];
  chartAvgLikes: { name: string; value: number }[];
  chartViewsPie: { name: string; value: number }[];
  allPosts: PostWithBrand[];
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Total Followers"
          value={fmtNum(totals.followers)}
          sub={`${totals.brands} brand aktif`}
          iconColor="#2F5CFF"
          iconBg="#EEF2FF"
        />
        <KpiCard
          icon={Instagram}
          label="Total Posts"
          value={fmtNum(totals.posts)}
          sub={`Rata-rata ${totals.brands > 0 ? Math.round(totals.posts / totals.brands) : 0} per brand`}
          iconColor="#E1306C"
          iconBg="#FCE7F3"
        />
        <KpiCard
          icon={Heart}
          label="Total Likes"
          value={fmtNum(totals.likes)}
          sub={`Avg ${fmtNum(totals.avgLikes)} per post`}
          iconColor="#16A34A"
          iconBg="#EAFBF1"
        />
        <KpiCard
          icon={Eye}
          label="Total Views"
          value={fmtNum(totals.views)}
          sub={`Avg ${fmtNum(totals.avgViews)} per post`}
          iconColor="#7C3AED"
          iconBg="#F5F3FF"
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {insights.map((ins, i) => {
            const toneColor =
              ins.tone === "good"
                ? "#16A34A"
                : ins.tone === "warn"
                  ? "#D97706"
                  : ins.tone === "blue"
                    ? "#2F5CFF"
                    : "#5B6478";
            const toneBg =
              ins.tone === "good"
                ? "#EAFBF1"
                : ins.tone === "warn"
                  ? "#FEF6E7"
                  : ins.tone === "blue"
                    ? "#EEF2FF"
                    : "#F6F7FB";
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-line bg-white p-3 transition hover:shadow-sm sm:p-4"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                  style={{ backgroundColor: toneBg }}
                >
                  {ins.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="text-xs font-semibold"
                    style={{ color: toneColor }}
                  >
                    {ins.title}
                  </div>
                  <div className="mt-0.5 text-xs text-ink sm:text-sm">
                    {ins.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grafik baris 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold">Followers per Brand</span>
            </div>
            <Pill tone="blue">{chartFollowers.length} brand</Pill>
          </div>
          {chartFollowers.length > 0 ? (
            <div style={{ height: 240 }}>
              <SimpleBarChart data={chartFollowers} formatY={fmtNum} />
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-xs text-sub">
              Belum ada data
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm font-semibold">
                Rata-rata Likes per Brand
              </span>
            </div>
            <Pill tone="good">Avg {fmtNum(totals.avgLikes)}</Pill>
          </div>
          {chartAvgLikes.length > 0 ? (
            <div style={{ height: 240 }}>
              <SimpleBarChart data={chartAvgLikes} formatY={fmtNum} />
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-xs text-sub">
              Belum ada data
            </div>
          )}
        </Card>
      </div>

      {/* Grafik baris 2 — Distribusi Views + ANALITIK PER POST */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4 text-ai" />
            <span className="text-sm font-semibold">
              Distribusi Views per Brand
            </span>
          </div>
          {chartViewsPie.length > 0 ? (
            <div className="flex justify-center">
              <SimplePieChart data={chartViewsPie} size={240} />
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-xs text-sub">
              Belum ada data
            </div>
          )}
        </Card>

        {/* ── ANALITIK PER POST (ganti Top 3 Engagement) ── */}
        <PostAnalyticsTab posts={allPosts} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Analitik Per Post — Ganti Top 3 Engagement
// ─────────────────────────────────────────────────────────
function PostAnalyticsTab({ posts }: { posts: PostWithBrand[] }) {
  const [sortKey, setSortKey] = useState<"views" | "likes" | "engagementRate">(
    "views",
  );

  // Sort + ambil top 10
  const topPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        if (sortKey === "views") return b.views - a.views;
        if (sortKey === "likes") return b.likes - a.likes;
        return b.engagementRate - a.engagementRate;
      })
      .slice(0, 10);
  }, [posts, sortKey]);

  const maxValue =
    topPosts.length > 0 ? Math.max(...topPosts.map((p) => p[sortKey])) : 1;

  if (posts.length === 0) {
    return (
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Analitik Per Post</span>
        </div>
        <div className="flex h-60 items-center justify-center text-xs text-sub">
          Belum ada data post
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-5">
      {/* Header tetap */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Analitik Per Post</span>
          <Pill tone="neutral">Top 10</Pill>
        </div>
        <div className="flex gap-1">
          {[
            { id: "views" as const, label: "Views" },
            { id: "likes" as const, label: "Likes" },
            { id: "engagementRate" as const, label: "ER" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setSortKey(s.id)}
              className="rounded-md px-2 py-1 text-[10px] font-medium transition"
              style={{
                backgroundColor: sortKey === s.id ? "#EEF2FF" : "transparent",
                color: sortKey === s.id ? "#2F5CFF" : "#5B6478",
                border: `1px solid ${sortKey === s.id ? "#2F5CFF" : "#E7E9F0"}`,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTAINER SCROLL — tinggi fix 400px ── */}
      <div
        className="flex flex-col gap-2 overflow-y-auto pr-1"
        style={{ maxHeight: 400 }}
      >
        {topPosts.map((post, idx) => {
          const value = post[sortKey];
          const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
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
              key={idx}
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
                  className="ml-auto text-[10px] font-semibold"
                  style={{ color: post.brandColor }}
                >
                  {sortKey === "engagementRate"
                    ? `${value.toFixed(2)}%`
                    : fmtNum(value)}
                </span>
              </div>

              <div className="line-clamp-1 pl-8 text-[11px] text-ink">
                {post.caption || "(tanpa caption)"}
              </div>

              <div className="flex items-center gap-3 pl-8 text-[10px] text-sub">
                <span className="inline-flex items-center gap-0.5">
                  <Heart className="h-2.5 w-2.5" />
                  {fmtNum(post.likes)}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  <Eye className="h-2.5 w-2.5" />
                  {fmtNum(post.views)}
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
              </div>

              <div className="h-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: post.brandColor,
                  }}
                />
              </div>
            </a>
          );
        })}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Tab: Perbandingan
// ─────────────────────────────────────────────────────────
function ComparisonTab({
  ranked,
  sortBy,
  onSortChange,
}: {
  ranked: IgBrand[];
  sortBy: keyof IgBrand;
  onSortChange: (v: keyof IgBrand) => void;
}) {
  const sortOptions: { value: string; label: string }[] = [
    { value: "followers", label: "Followers" },
    { value: "posts", label: "Posts" },
    { value: "totalLikes", label: "Total Likes" },
    { value: "totalViews", label: "Total Views" },
    { value: "avgLikes", label: "Avg Likes" },
    { value: "avgViews", label: "Avg Views" },
    { value: "engagementRate", label: "Engagement Rate" },
  ];

  const maxVal = ranked[0] ? Number(ranked[0][sortBy]) || 0 : 0;
  const currentLabel =
    sortOptions.find((o) => o.value === sortBy)?.label ?? "Followers";

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-sub">
              Urutkan berdasarkan:
            </span>
            <Select
              value={sortBy as string}
              onChange={(v) => onSortChange(v as keyof IgBrand)}
              options={sortOptions}
            />
          </div>
          <Pill tone="blue">{ranked.length} brand</Pill>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {ranked.map((b, idx) => {
          const value = Number(b[sortBy]) || 0;
          const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
          const medal =
            idx === 0
              ? "🥇"
              : idx === 1
                ? "🥈"
                : idx === 2
                  ? "🥉"
                  : `#${idx + 1}`;
          const isMedal = idx < 3;

          return (
            <div
              key={b.id}
              className="rounded-2xl border p-3 transition hover:shadow-sm sm:p-4"
              style={{
                borderColor: isMedal ? `${b.color}40` : "#E7E9F0",
                backgroundColor: isMedal ? `${b.color}08` : "white",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: isMedal ? `${b.color}20` : "#F1F3F9",
                    color: isMedal ? b.color : "#5B6478",
                  }}
                >
                  {medal}
                </span>

                {b.avatar ? (
                  <img
                    src={b.avatar}
                    alt={b.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    style={{ border: `2px solid ${b.color}` }}
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.shortName.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">
                      {b.name}
                    </span>
                    {b.verified && (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />
                    )}
                  </div>
                  {b.username && (
                    <div className="mt-0.5 text-[10px] text-sub">
                      @{b.username}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-lg font-bold text-ink">
                    {sortBy === "engagementRate"
                      ? `${value.toFixed(2)}%`
                      : fmtNum(value)}
                  </div>
                  <div className="text-[10px] text-sub">{currentLabel}</div>
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: b.color }}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="text-[9px] uppercase tracking-wide text-sub">
                    Posts
                  </div>
                  <div className="mt-0.5 text-xs font-semibold">{b.posts}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="text-[9px] uppercase tracking-wide text-sub">
                    Avg Likes
                  </div>
                  <div className="mt-0.5 text-xs font-semibold">
                    {fmtNum(b.avgLikes)}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 text-center">
                  <div className="text-[9px] uppercase tracking-wide text-sub">
                    Avg Views
                  </div>
                  <div className="mt-0.5 text-xs font-semibold">
                    {fmtNum(b.avgViews)}
                  </div>
                </div>
                <div
                  className="rounded-lg p-2 text-center"
                  style={{
                    backgroundColor:
                      b.engagementRate >= 1.5 ? "#EAFBF1" : "#FEF6E7",
                  }}
                >
                  <div className="text-[9px] uppercase tracking-wide text-sub">
                    ER
                  </div>
                  <div
                    className="mt-0.5 text-xs font-semibold"
                    style={{
                      color: b.engagementRate >= 1.5 ? "#16A34A" : "#D97706",
                    }}
                  >
                    {b.engagementRate.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabel detail */}
      <Card className="overflow-hidden">
        <div className="border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-sub" />
            <span className="text-sm font-semibold">Tabel Detail</span>
            <Pill tone="neutral">{ranked.length} brand</Pill>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ minWidth: 800 }}>
            <thead className="bg-slate-50">
              <tr className="text-[10px] uppercase tracking-wide text-sub">
                {[
                  "Brand",
                  "Followers",
                  "Posts",
                  "Total Likes",
                  "Total Views",
                  "Avg Likes",
                  "Avg Views",
                  "ER %",
                  "L/V %",
                ].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-3 font-semibold sm:px-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-line transition hover:bg-slate-50"
                >
                  <td className="px-3 py-3 sm:px-4">
                    <span className="flex items-center gap-2">
                      <BrandDot id={b.id} />
                      <span className="font-medium">{b.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold sm:px-4">
                    {fmtNum(b.followers)}
                  </td>
                  <td className="px-3 py-3 sm:px-4">{b.posts}</td>
                  <td className="px-3 py-3 sm:px-4">{fmtNum(b.totalLikes)}</td>
                  <td className="px-3 py-3 sm:px-4">{fmtNum(b.totalViews)}</td>
                  <td className="px-3 py-3 sm:px-4">{fmtNum(b.avgLikes)}</td>
                  <td className="px-3 py-3 sm:px-4">{fmtNum(b.avgViews)}</td>
                  <td className="px-3 py-3 sm:px-4">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor:
                          b.engagementRate >= 3
                            ? "#EAFBF1"
                            : b.engagementRate >= 1.5
                              ? "#EEF2FF"
                              : "#FEF6E7",
                        color:
                          b.engagementRate >= 3
                            ? "#16A34A"
                            : b.engagementRate >= 1.5
                              ? "#2F5CFF"
                              : "#D97706",
                      }}
                    >
                      {b.engagementRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-sub sm:px-4">
                    {b.likeViewRatio.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Tab: Post Terbaru
// ─────────────────────────────────────────────────────────
function PostsTab({ brands }: { brands: IgBrand[] }) {
  const withPosts = brands.filter((b) => b.recentPosts.length > 0);

  if (withPosts.length === 0) {
    return (
      <Card className="p-12 text-center text-sm text-sub">
        Belum ada post terbaru.
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {withPosts.map((b) => (
        <Card key={b.id} className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <BrandDot id={b.id} />
              <span className="truncate text-sm font-semibold">{b.name}</span>
              <span className="text-[10px] text-sub">@{b.username}</span>
            </div>
            {b.url && (
              <a
                href={b.url}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1 text-[10px] font-medium hover:underline"
                style={{ color: "#E1306C" }}
              >
                Lihat Profil
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {b.recentPosts.map((p, idx) => {
              const isHigh = (p.likes ?? 0) > b.avgLikes;
              return (
                <a
                  key={idx}
                  href={p.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:bg-slate-50"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor:
                        p.type === "reel" ? "#FCE7F3" : "#EEF2FF",
                    }}
                  >
                    {p.type === "reel" ? (
                      <Film className="h-4 w-4" style={{ color: "#E1306C" }} />
                    ) : (
                      <Instagram className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-ink">
                      {(p.caption ?? "").substring(0, 80) || "(tanpa caption)"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-sub">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {fmtNum(p.likes ?? 0)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {fmtNum(p.views ?? 0)}
                      </span>
                      {isHigh && (
                        <Pill tone="good" className="!px-1.5 !py-0 !text-[9px]">
                          🔥 High
                        </Pill>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sub" />
                </a>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
