import { useState } from "react";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Card, Pill, SectionHeader, AiBadge, Select } from "@/components/ui";
import { useGenerateCaption } from "@/hooks/useAi";
import { useToast } from "@/hooks/useToast";
import { BRANDS } from "@/lib/constants";

interface ScoreResult {
  score: number;
  good: string[];
  improve: string[];
  raw: string;
}

export function ContentCheckPage() {
  const { push } = useToast();
  const genCaption = useGenerateCaption();

  const [form, setForm] = useState({
    brandId: BRANDS[0].id,
    title: "",
    hook: "",
    caption: "",
    cta: "",
  });
  const [result, setResult] = useState<ScoreResult | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleCheck() {
    if (!form.title.trim()) {
      push("Isi judul konten dulu");
      return;
    }

    const brand = BRANDS.find((b) => b.id === form.brandId)!;

    const prompt = `Nilai kualitas konten berikut dan berikan skor + saran.

Brand: ${brand.name} (${brand.category})
Judul: ${form.title}
Hook: ${form.hook || "(kosong)"}
Caption: ${form.caption || "(kosong)"}
CTA: ${form.cta || "(kosong)"}

Balas HANYA JSON dengan format:
{
  "score": <angka 0-100>,
  "good": ["poin bagus 1", "poin bagus 2"],
  "improve": ["saran perbaikan 1", "saran perbaikan 2"]
}

Nilai berdasarkan: hook menarik, caption jelas, CTA kuat, sesuai audiens brand.`;

    try {
      setResult(null);
      const reply = await genCaption.mutateAsync({
        brand: brand.name,
        title: prompt,
        platform: "Instagram",
      });

      try {
        const clean = reply
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        const start = clean.indexOf("{");
        const end = clean.lastIndexOf("}");
        const jsonStr =
          start >= 0 && end > start ? clean.substring(start, end + 1) : clean;
        const parsed = JSON.parse(jsonStr);

        setResult({
          score: Number(parsed.score) || 0,
          good: Array.isArray(parsed.good) ? parsed.good : [],
          improve: Array.isArray(parsed.improve) ? parsed.improve : [],
          raw: reply,
        });
      } catch {
        setResult({
          score: 50,
          good: ["Konten sudah cukup baik"],
          improve: [reply.substring(0, 300)],
          raw: reply,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal cek konten";
      push(`Gagal: ${msg}`);
    }
  }

  const inputCls =
    "rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Cek Konten"
        desc="Review kualitas konten dengan AI sebelum dipublikasikan."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Form */}
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="mb-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ai" />
            <span className="text-sm font-semibold">Konten yang Dicek</span>
            <AiBadge />
          </div>

          <Select
            label="Brand"
            value={form.brandId}
            onChange={(v) => set("brandId", v)}
            options={BRANDS.map((b) => ({ value: b.id, label: b.name }))}
          />

          <label className="flex flex-col gap-1 text-xs text-sub">
            <span className="font-medium">Judul *</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Judul konten"
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-sub">
            <span className="font-medium">Hook</span>
            <input
              value={form.hook}
              onChange={(e) => set("hook", e.target.value)}
              placeholder="Kalimat pembuka"
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-sub">
            <span className="font-medium">Caption</span>
            <textarea
              rows={4}
              value={form.caption}
              onChange={(e) => set("caption", e.target.value)}
              placeholder="Caption konten..."
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1 text-xs text-sub">
            <span className="font-medium">CTA</span>
            <input
              value={form.cta}
              onChange={(e) => set("cta", e.target.value)}
              placeholder="Cek link di bio."
              className={inputCls}
            />
          </label>

          <button
            onClick={handleCheck}
            disabled={genCaption.isPending || !form.title.trim()}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-ai py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {genCaption.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Menilai…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Cek dengan AI
              </>
            )}
          </button>
        </Card>

        {/* Result */}
        <Card className="p-4 sm:p-5">
          {!result ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="mb-3 h-12 w-12 text-line" />
              <div className="text-sm font-semibold text-ink">
                Belum ada hasil
              </div>
              <p className="mt-1 text-xs text-sub">
                Isi form di kiri, lalu klik "Cek dengan AI".
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <div className="text-xs text-sub">Skor</div>
                <div
                  className="text-5xl font-bold"
                  style={{
                    color:
                      result.score >= 70
                        ? "#16A34A"
                        : result.score >= 40
                          ? "#D97706"
                          : "#DC2626",
                  }}
                >
                  {result.score}
                </div>
                <div className="mt-1 text-xs text-sub">dari 100</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${result.score}%`,
                      backgroundColor:
                        result.score >= 70
                          ? "#16A34A"
                          : result.score >= 40
                            ? "#D97706"
                            : "#DC2626",
                    }}
                  />
                </div>
              </div>

              {result.good.length > 0 && (
                <div className="rounded-xl border border-success-bg bg-success-bg p-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-success" />
                    <span className="text-xs font-semibold text-success">
                      Yang Bagus
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-ink">
                    {result.good.map((g, i) => (
                      <li key={i} className="flex gap-2">
                        <span>✓</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.improve.length > 0 && (
                <div className="rounded-xl border border-warn-bg bg-warn-bg p-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-warn" />
                    <span className="text-xs font-semibold text-warn">
                      Perlu Diperbaiki
                    </span>
                  </div>
                  <ul className="space-y-1 text-xs text-ink">
                    {result.improve.map((g, i) => (
                      <li key={i} className="flex gap-2">
                        <span>→</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Pill tone="neutral">⚠️ Hasil AI bersifat saran</Pill>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
