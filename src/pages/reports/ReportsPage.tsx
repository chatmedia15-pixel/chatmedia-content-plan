import { useMemo, useState } from "react";
import {
  FileText,
  BarChart3,
  TrendingUp,
  Users,
  Sparkles,
  Download,
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
import { fmtNum, monthKey, monthLabel } from "@/lib/format";
import { useContentItems } from "@/hooks/useContentItems";
import { useToast } from "@/hooks/useToast";

export function ReportsPage() {
  const { push } = useToast();
  const [month, setMonth] = useState("all");

  const query = useContentItems();
  const items = query.data ?? [];

  // ── Daftar bulan ──────────────────────────────
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

  // ── Filter ─────────────────────────────────────
  const filtered = useMemo(() => {
    if (month === "all") return items;
    return items.filter((it) => monthKey(it.planned_date) === month);
  }, [items, month]);

  // ── KPI ────────────────────────────────────────
  const kpi = useMemo(() => {
    const total = filtered.length;
    const published = filtered.filter(
      (it) => it.workflow_stage === "published",
    ).length;
    const planning = filtered.filter(
      (it) => it.workflow_stage === "planning",
    ).length;
    const calendar = filtered.filter(
      (it) => it.workflow_stage === "calendar",
    ).length;

    // Brand terbaik = yang paling banyak publish
    const brandCount: Record<string, number> = {};
    filtered
      .filter((it) => it.workflow_stage === "published")
      .forEach((it) => {
        brandCount[it.brand_id] = (brandCount[it.brand_id] ?? 0) + 1;
      });
    const topBrandId = Object.entries(brandCount).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];
    const topBrand = BRANDS.find((b) => b.id === topBrandId)?.name ?? "-";

    // Format terbaik = yang paling banyak dipakai
    const formatCount: Record<string, number> = {};
    filtered.forEach((it) => {
      if (!it.format) return;
      formatCount[it.format] = (formatCount[it.format] ?? 0) + 1;
    });
    const topFormat =
      Object.entries(formatCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    return { total, published, planning, calendar, topBrand, topFormat };
  }, [filtered]);

  // ── Charts ────────────────────────────────────
  const byBrand = useMemo(() => {
    const g: Record<string, number> = {};
    filtered.forEach((it) => {
      const b = BRANDS.find((x) => x.id === it.brand_id);
      const name = b?.name ?? it.brand_id;
      g[name] = (g[name] ?? 0) + 1;
    });
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byStatus = useMemo(() => {
    const g: Record<string, number> = {};
    filtered.forEach((it) => {
      g[it.production_status] = (g[it.production_status] ?? 0) + 1;
    });
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Export CSV ─────────────────────────────────
  function handleExport() {
    if (filtered.length === 0) {
      push("Tidak ada data untuk diekspor");
      return;
    }
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
    push("Laporan diekspor");
  }

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Laporan"
        desc="Ringkasan performa konten internal."
        action={
          <div className="flex flex-wrap gap-2">
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
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              Ekspor CSV
            </button>
          </div>
        }
      />

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

      {/* Distribusi stage */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3">
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

      {/* Charts */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-sm font-semibold">Konten per Brand</span>
              </div>
              <Pill tone="blue">{byBrand.length} brand</Pill>
            </div>
            <div style={{ height: 240 }}>
              <SimpleBarChart data={byBrand} formatY={fmtNum} />
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-ai" />
              <span className="text-sm font-semibold">
                Distribusi Status Produksi
              </span>
            </div>
            <div className="flex justify-center">
              <SimplePieChart data={byStatus} size={240} />
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

      {/* Tabel ringkas */}
      {filtered.length > 0 && (
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
                  const brandItems = filtered.filter(
                    (it) => it.brand_id === b.id,
                  );
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
