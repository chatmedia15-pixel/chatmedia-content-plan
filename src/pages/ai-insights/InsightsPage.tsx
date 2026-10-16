import { useState } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { Card, Pill, SectionHeader, AiBadge } from "@/components/ui";
import { useAnalyzeInsights } from "@/hooks/useAi";
import { useToast } from "@/hooks/useToast";
import { BRANDS, statusStyle } from "@/lib/constants";
import { useContentItems } from "@/hooks/useContentItems";

export function InsightsPage() {
  const { push } = useToast();
  const analyze = useAnalyzeInsights();
  const contentQuery = useContentItems();

  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const items = contentQuery.data ?? [];

  // ── Susun konteks untuk AI ─────────────────────
  function buildContext(): string {
    const byBrand = BRANDS.map((b) => {
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

      const statusBreakdown: Record<string, number> = {};
      brandItems.forEach((it) => {
        statusBreakdown[it.production_status] =
          (statusBreakdown[it.production_status] ?? 0) + 1;
      });

      const statusText = Object.entries(statusBreakdown)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");

      return `- ${b.name} (${b.category}):
    Total: ${total} | Planning: ${planning} | Kalender: ${calendar} | Published: ${published}
    Status produksi: ${statusText || "belum ada"}`;
    }).join("\n");

    const total = items.length;
    const published = items.filter(
      (it) => it.workflow_stage === "published",
    ).length;

    return `Total konten di sistem: ${total}
Total konten dipublikasi: ${published}
Jumlah brand: ${BRANDS.length}

Detail per brand:
${byBrand}`;
  }

  async function handleAnalyze() {
    if (items.length === 0) {
      push("Belum ada data konten untuk dianalisis");
      return;
    }
    try {
      setResult(null);
      const text = await analyze.mutateAsync({ context: buildContext() });
      setResult(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal analisis";
      push(`Gagal: ${msg}`);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    push("Hasil disalin");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Insight AI"
        desc="Analisis performa konten lintas brand dengan bantuan AI."
      />

      {/* Status info */}
      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" />
            <span className="text-sm font-semibold">Analisis dengan AI</span>
            <AiBadge />
          </div>
          <Pill tone="neutral">{items.length} konten tersedia</Pill>
        </div>

        <div className="rounded-xl border border-line bg-slate-50 p-3 text-xs text-sub">
          <div className="mb-1 font-medium text-ink">
            Data yang akan dianalisis:
          </div>
          <ul className="ml-4 list-disc space-y-0.5">
            <li>Jumlah konten per brand</li>
            <li>Distribusi per tahap (Planning, Kalender, Published)</li>
            <li>Breakdown status produksi</li>
          </ul>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleAnalyze}
            disabled={analyze.isPending || items.length === 0}
            className="flex items-center gap-2 rounded-lg bg-ai px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {analyze.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin-slow" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {analyze.isPending
              ? "Menganalisis…"
              : result
                ? "Analisis Ulang"
                : "Mulai Analisis"}
          </button>

          {result && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-sub transition hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-success" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Salin Hasil
                </>
              )}
            </button>
          )}
        </div>
      </Card>

      {/* Loading */}
      {analyze.isPending && (
        <Card className="flex items-center gap-3 p-4 text-sm text-sub">
          <Loader2 className="h-4 w-4 animate-spin-slow text-ai" />
          AI sedang membaca data dan menyusun analisis…
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" />
            <span className="text-sm font-semibold">Hasil Analisis</span>
            <AiBadge />
          </div>
          <div className="whitespace-pre-wrap rounded-xl bg-ai-bg p-4 text-sm leading-relaxed text-ink">
            {result}
          </div>
          <div className="mt-3 text-[10px] text-sub">
            ⚠️ Hasil AI adalah saran, bukan kebenaran mutlak. Gunakan sebagai
            pertimbangan.
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!result && !analyze.isPending && items.length === 0 && (
        <Card className="p-12 text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">
            Belum ada data untuk dianalisis
          </div>
          <p className="mt-1 text-xs text-sub">
            Tambahkan konten di halaman Ide Konten atau Perencanaan dulu.
          </p>
        </Card>
      )}
    </div>
  );
}

// Helper yang tidak dipakai — mencegah unused
void statusStyle;
