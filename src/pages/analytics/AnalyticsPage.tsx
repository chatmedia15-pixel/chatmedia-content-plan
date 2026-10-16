import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarRange,
  CalendarDays,
  Archive,
  Film,
} from "lucide-react";
import {
  Card,
  Pill,
  BrandDot,
  PlatformIcon,
  Select,
  KpiCard,
  SectionHeader,
} from "@/components/ui";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { SimplePieChart } from "@/components/charts/SimplePieChart";
import { InstagramPanel } from "@/components/analytics/InstagramPanel";
import { BRANDS } from "@/lib/constants";
import { fmtDate, fmtNum, monthKey, monthLabel } from "@/lib/format";
import { useContentItems } from "@/hooks/useContentItems";
import type { ContentItem } from "@/types/content";

type SourceLabel = "Perencanaan" | "Kalender" | "Dipublikasi";

interface RowWithSource extends ContentItem {
  _source: SourceLabel;
}

export function AnalyticsPage() {
  const [brand, setBrand] = useState("all");
  const [month, setMonth] = useState("all");

  const query = useContentItems();
  const items = query.data ?? [];

  const allData = useMemo<RowWithSource[]>(() => {
    return items.map((it) => {
      let src: SourceLabel = "Perencanaan";
      if (it.workflow_stage === "calendar") src = "Kalender";
      else if (it.workflow_stage === "published") src = "Dipublikasi";
      return { ...it, _source: src };
    });
  }, [items]);

  const availableMonths = useMemo(() => {
    const months: Record<string, number> = {};
    allData.forEach((p) => {
      const key = monthKey(p.planned_date);
      if (!key) return;
      months[key] = (months[key] ?? 0) + 1;
    });
    return Object.keys(months)
      .sort()
      .reverse()
      .map((k) => ({ value: k, label: monthLabel(k), count: months[k] }));
  }, [allData]);

  const filtered = useMemo(() => {
    return allData.filter((p) => {
      if (brand !== "all" && p.brand_id !== brand) return false;
      if (month !== "all" && monthKey(p.planned_date) !== month) return false;
      return true;
    });
  }, [allData, brand, month]);

  const kpi = {
    total: filtered.length,
    planning: filtered.filter((p) => p._source === "Perencanaan").length,
    calendar: filtered.filter((p) => p._source === "Kalender").length,
    published: filtered.filter((p) => p._source === "Dipublikasi").length,
  };

  const byBrand = useMemo(() => {
    const g: Record<string, number> = {};
    filtered.forEach((p) => {
      const brand = BRANDS.find((b) => b.id === p.brand_id);
      const name = brand?.name ?? p.brand_id;
      g[name] = (g[name] ?? 0) + 1;
    });
    return Object.entries(g).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const barColors = useMemo(() => {
    return byBrand.map((d) => {
      const b = BRANDS.find((x) => x.name === d.name);
      return b?.color ?? "#2F5CFF";
    });
  }, [byBrand]);

  const bySource = useMemo(() => {
    const g: Record<SourceLabel, number> = {
      Perencanaan: 0,
      Kalender: 0,
      Dipublikasi: 0,
    };
    filtered.forEach((p) => {
      g[p._source]++;
    });
    return Object.entries(g)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const publishedFiltered = useMemo(() => {
    return filtered
      .filter((p) => p._source === "Dipublikasi")
      .sort((a, b) => {
        const da = a.published_at ?? a.planned_date ?? "";
        const db = b.published_at ?? b.planned_date ?? "";
        return db.localeCompare(da);
      });
  }, [filtered]);

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Analitik"
        desc="Analisis performa konten & Instagram lintas brand."
      />

      <InstagramPanel />

      <div className="mt-2 flex items-center gap-2">
        <Film className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Analitik Konten Internal</span>
        <Pill tone="neutral">{filtered.length} konten</Pill>
      </div>

      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
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
          <Select
            value={brand}
            onChange={setBrand}
            options={[
              { value: "all", label: "Semua Brand" },
              ...BRANDS.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <KpiCard
          icon={BarChart3}
          label="Total"
          value={kpi.total}
          sub="Semua sumber terfilter"
          iconColor="#2F5CFF"
          iconBg="#EEF2FF"
        />
        <KpiCard
          icon={CalendarRange}
          label="Perencanaan"
          value={kpi.planning}
          sub="Di staging"
          iconColor="#D97706"
          iconBg="#FEF6E7"
        />
        <KpiCard
          icon={CalendarDays}
          label="Kalender"
          value={kpi.calendar}
          sub="Sedang diproduksi"
          iconColor="#7C3AED"
          iconBg="#F5F3FF"
        />
        <KpiCard
          icon={Archive}
          label="Dipublikasi"
          value={kpi.published}
          sub="Sudah tayang"
          iconColor="#16A34A"
          iconBg="#EAFBF1"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold">Konten per Brand</span>
            </div>
            <Pill tone="blue">{byBrand.length} brand</Pill>
          </div>
          {byBrand.length > 0 ? (
            <div style={{ height: 260 }}>
              <SimpleBarChart
                data={byBrand}
                colors={barColors}
                formatY={fmtNum}
              />
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-xs text-sub">
              Belum ada data pada filter ini
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-ai" />
            <span className="text-sm font-semibold">Distribusi per Sumber</span>
          </div>
          {bySource.length > 0 ? (
            <div className="flex justify-center">
              <SimplePieChart data={bySource} size={240} />
            </div>
          ) : (
            <div className="flex h-60 items-center justify-center text-xs text-sub">
              Belum ada data pada filter ini
            </div>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-success" />
            <span className="text-sm font-semibold">Konten Dipublikasi</span>
            <Pill tone="good">{publishedFiltered.length} konten</Pill>
          </div>
        </div>

        {publishedFiltered.length === 0 ? (
          <div className="py-10 text-center text-sm text-sub">
            Belum ada konten dipublikasi pada filter ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-left text-sm"
              style={{ minWidth: 900 }}
            >
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-wide text-sub">
                  {[
                    "Tanggal",
                    "Judul",
                    "Brand",
                    "Platform",
                    "Format",
                    "Link",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 font-semibold sm:px-5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {publishedFiltered.map((p) => {
                  const brand = BRANDS.find((b) => b.id === p.brand_id);
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-line transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs sm:px-5">
                        {fmtDate(p.published_at ?? p.planned_date)}
                      </td>
                      <td
                        className="truncate px-4 py-3 sm:px-5"
                        style={{ maxWidth: 260 }}
                      >
                        {p.title}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <span className="flex items-center gap-1.5">
                          <BrandDot id={p.brand_id} />
                          {brand?.name ?? p.brand_id}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        <span className="flex items-center gap-1">
                          <PlatformIcon
                            platform={p.platform}
                            className="h-3.5 w-3.5"
                          />
                          {p.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs sm:px-5">
                        {p.format ?? "-"}
                      </td>
                      <td className="px-4 py-3 sm:px-5">
                        {p.published_url ? (
                          <a
                            href={p.published_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Buka
                          </a>
                        ) : (
                          <span className="text-xs text-sub">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
