import { useState } from "react";
import { FlaskConical, Sparkles, Loader2, Trophy } from "lucide-react";
import { Card, Pill, SectionHeader, AiBadge, Select } from "@/components/ui";
import { useGenerateCaption } from "@/hooks/useAi";
import { useToast } from "@/hooks/useToast";
import { BRANDS } from "@/lib/constants";

export function ExperimentsPage() {
  const { push } = useToast();
  const genCaption = useGenerateCaption();

  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const [hookA, setHookA] = useState("");
  const [hookB, setHookB] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function handleCompare() {
    if (!hookA.trim() || !hookB.trim()) {
      push("Isi kedua hook dulu");
      return;
    }

    const brand = BRANDS.find((b) => b.id === brandId)!;

    const prompt = `Bandingkan 2 hook konten untuk brand "${brand.name}" (${brand.category}).

Hook A: "${hookA}"
Hook B: "${hookB}"

Analisis singkat (maks 200 kata) dengan format:
1. Kelebihan Hook A
2. Kelebihan Hook B
3. Rekomendasi mana yang lebih baik dan alasannya

Bahasa Indonesia.`;

    try {
      setResult(null);
      const reply = await genCaption.mutateAsync({
        brand: brand.name,
        title: prompt,
        platform: "Instagram",
      });
      setResult(reply);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal analisis";
      push(`Gagal: ${msg}`);
    }
  }

  function handleSwap() {
    const tmp = hookA;
    setHookA(hookB);
    setHookB(tmp);
  }

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Lab Eksperimen"
        desc="Uji A/B hook konten untuk menemukan yang paling menarik."
      />

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-ai" />
            <span className="text-sm font-semibold">Uji 2 Hook</span>
            <AiBadge />
          </div>
          <button
            onClick={handleSwap}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-sub transition hover:bg-slate-50"
          >
            ⇄ Tukar
          </button>
        </div>

        <div className="mb-4">
          <Select
            label="Brand"
            value={brandId}
            onChange={setBrandId}
            options={BRANDS.map((b) => ({ value: b.id, label: b.name }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-sub">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                A
              </span>
              Hook A
            </label>
            <textarea
              rows={4}
              value={hookA}
              onChange={(e) => setHookA(e.target.value)}
              placeholder="Contoh: Rahasia rambut rapi tanpa keluar banyak uang..."
              className="w-full rounded-lg border border-line p-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-sub">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ai text-[10px] font-bold text-white">
                B
              </span>
              Hook B
            </label>
            <textarea
              rows={4}
              value={hookB}
              onChange={(e) => setHookB(e.target.value)}
              placeholder="Contoh: 3 kesalahan potong rambut yang bikin kamu kelihatan tua..."
              className="w-full rounded-lg border border-line p-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={genCaption.isPending || !hookA.trim() || !hookB.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-ai py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto sm:px-6"
        >
          {genCaption.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin-slow" />
              Menganalisis…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analisis dengan AI
            </>
          )}
        </button>
      </Card>

      {result && (
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warn" />
            <span className="text-sm font-semibold">Hasil Analisis</span>
            <AiBadge />
          </div>
          <div className="whitespace-pre-wrap rounded-xl bg-ai-bg p-4 text-sm leading-relaxed text-ink">
            {result}
          </div>
          <div className="mt-3">
            <Pill tone="neutral">⚠️ Hasil AI bersifat saran</Pill>
          </div>
        </Card>
      )}
    </div>
  );
}
