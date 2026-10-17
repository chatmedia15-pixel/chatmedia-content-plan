import { useState } from "react";
import { Sparkles, Loader2, Wand2, RotateCcw, Undo2 } from "lucide-react";
import {
  BRANDS,
  PLATFORMS,
  FORMATS,
  OBJECTIVES,
  PRODUCTION_STATUSES,
  CONTENT_STYLES,
  type Platform,
} from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { Select } from "@/components/ui";
import { useGenerateCaption } from "@/hooks/useAi";

export interface ContentFormValues {
  brand_id: string;
  platform: Platform;
  format: string;
  content_pillar: string;
  objective: string;
  style: string;
  title: string;
  hook: string;
  caption: string;
  cta: string;
  link_ref: string;
  production_status: string;
  planned_date: string;
}

interface ContentFormProps {
  initial?: Partial<ContentFormValues>;
  onSubmit: (values: ContentFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

function defaultValues(): ContentFormValues {
  const first = BRANDS[0];
  return {
    brand_id: first.id,
    platform: "Instagram",
    format: FORMATS.Instagram[0],
    content_pillar: first.pillars[0],
    objective: OBJECTIVES[0],
    style: CONTENT_STYLES[0],
    title: "",
    hook: "",
    caption: "",
    cta: "",
    link_ref: "",
    production_status: "Direncanakan",
    planned_date: toDateInput(new Date()),
  };
}

export function ContentForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Simpan",
}: ContentFormProps) {
  const [form, setForm] = useState<ContentFormValues>({
    ...defaultValues(),
    ...initial,
  });
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiHistory, setAiHistory] = useState<string[]>([]);
  const [regenCount, setRegenCount] = useState(0);

  const genCaption = useGenerateCaption();

  function set<K extends keyof ContentFormValues>(
    key: K,
    value: ContentFormValues[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const brand = BRANDS.find((b) => b.id === form.brand_id) ?? BRANDS[0];
  const pillarOptions = brand.pillars;
  const formatOptions = FORMATS[form.platform] ?? FORMATS.Instagram;

  function handleBrandChange(id: string) {
    const b = BRANDS.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      brand_id: id,
      content_pillar: b?.pillars[0] ?? f.content_pillar,
    }));
  }

  function handlePlatformChange(p: string) {
    const platform = p as Platform;
    setForm((f) => ({
      ...f,
      platform,
      format: FORMATS[platform][0],
    }));
  }

  // ── Generate caption (dengan dukungan regenerate) ──
  async function handleGenerateCaption() {
    if (!form.title.trim()) {
      setAiError("Isi judul dulu sebelum generate caption");
      return;
    }

    // Simpan caption sekarang ke history (kalau ada)
    if (form.caption.trim()) {
      setAiHistory((h) => [form.caption, ...h].slice(0, 5));
    }

    setAiError(null);

    try {
      const caption = await genCaption.mutateAsync({
        brand: brand.name,
        title: form.title,
        hook: form.hook || undefined,
        platform: form.platform,
        pillar: form.content_pillar || undefined,
      });
      set("caption", caption);
      setRegenCount((c) => c + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal generate caption";
      setAiError(msg);
    }
  }

  // ── Undo ke caption sebelumnya ────────────────
  function handleUndo() {
    if (aiHistory.length === 0) return;
    const [prev, ...rest] = aiHistory;
    set("caption", prev);
    setAiHistory(rest);
    setRegenCount((c) => Math.max(0, c - 1));
  }

  // ── Reset ke caption awal (dari initial) ──────
  function handleReset() {
    set("caption", initial?.caption ?? "");
    setAiHistory([]);
    setRegenCount(0);
    setAiError(null);
  }

  const inputCls =
    "rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-primary";

  const hasCaption = form.caption.trim().length > 0;
  const hasHistory = aiHistory.length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        onSubmit(form);
      }}
      className="flex flex-col gap-3 text-sm"
    >
      {/* Baris 1 */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Tanggal</span>
          <input
            type="date"
            value={form.planned_date}
            onChange={(e) => set("planned_date", e.target.value)}
            className={inputCls}
          />
        </label>
        <Select
          label="Brand"
          value={form.brand_id}
          onChange={handleBrandChange}
          options={BRANDS.map((b) => ({ value: b.id, label: b.name }))}
        />
      </div>

      {/* Baris 2 */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Platform"
          value={form.platform}
          onChange={handlePlatformChange}
          options={PLATFORMS}
        />
        <Select
          label="Format"
          value={form.format}
          onChange={(v) => set("format", v)}
          options={formatOptions}
        />
      </div>

      {/* Baris 3 */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Pillar"
          value={form.content_pillar}
          onChange={(v) => set("content_pillar", v)}
          options={pillarOptions}
        />
        <Select
          label="Objective"
          value={form.objective}
          onChange={(v) => set("objective", v)}
          options={OBJECTIVES}
        />
      </div>

      {/* Baris 4 */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Gaya"
          value={form.style}
          onChange={(v) => set("style", v)}
          options={CONTENT_STYLES}
        />
        <Select
          label="Status Produksi"
          value={form.production_status}
          onChange={(v) => set("production_status", v)}
          options={PRODUCTION_STATUSES}
        />
      </div>

      {/* Judul */}
      <label className="flex flex-col gap-1 text-xs text-sub">
        <span className="font-medium">Judul *</span>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Judul konten"
          className={inputCls}
        />
      </label>

      {/* Hook */}
      <label className="flex flex-col gap-1 text-xs text-sub">
        <span className="font-medium">Hook</span>
        <textarea
          rows={2}
          value={form.hook}
          onChange={(e) => set("hook", e.target.value)}
          placeholder="Kalimat pembuka menarik"
          className={inputCls}
        />
      </label>

      {/* Caption — dengan AI generate + regenerate */}
      <div className="flex flex-col gap-1.5">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-sub">Caption</span>
            {regenCount > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                AI · {regenCount}x
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tombol Undo — kalau ada history */}
            {hasHistory && (
              <button
                type="button"
                onClick={handleUndo}
                disabled={genCaption.isPending}
                className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-sub transition hover:bg-slate-50 disabled:opacity-60"
                title="Kembalikan ke caption sebelumnya"
              >
                <Undo2 className="h-3 w-3" />
                Undo
              </button>
            )}

            {/* Tombol Reset — kalau sudah ada caption tapi mau kosongkan */}
            {hasCaption && (
              <button
                type="button"
                onClick={handleReset}
                disabled={genCaption.isPending}
                className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-medium text-sub transition hover:bg-slate-50 disabled:opacity-60"
                title="Reset caption ke kondisi awal"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}

            {/* Tombol Generate / Regenerate */}
            <button
              type="button"
              onClick={handleGenerateCaption}
              disabled={genCaption.isPending || !form.title.trim()}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition hover:bg-ai-bg disabled:opacity-60"
              style={{
                borderColor: "#C7D2FE",
                color: "#7C3AED",
              }}
              title={
                hasCaption
                  ? "Generate caption baru (hasil berbeda)"
                  : "Generate caption otomatis dengan AI"
              }
            >
              {genCaption.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin-slow" />
                  Generating…
                </>
              ) : hasCaption ? (
                <>
                  <RotateCcw className="h-3 w-3" />
                  Regenerate
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  Generate AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          rows={5}
          value={form.caption}
          onChange={(e) => set("caption", e.target.value)}
          placeholder="Caption konten... (atau klik 'Generate AI' di atas)"
          className={inputCls}
          style={
            genCaption.isPending
              ? { opacity: 0.6, pointerEvents: "none" }
              : undefined
          }
          disabled={genCaption.isPending}
        />

        {/* Info hint saat pertama kali */}
        {!hasCaption && !genCaption.isPending && form.title.trim() && (
          <div className="text-[10px] text-sub">
            💡 Isi Hook dulu untuk hasil caption yang lebih optimal, lalu klik{" "}
            <strong>Generate AI</strong>.
          </div>
        )}

        {/* Info regenerate */}
        {hasCaption && !genCaption.isPending && (
          <div className="flex items-center gap-1 text-[10px] text-sub">
            🔄 Tidak puas? Klik <strong>Regenerate</strong> untuk hasil berbeda
            {hasHistory && (
              <>
                , atau <strong>Undo</strong> untuk kembali
              </>
            )}
          </div>
        )}

        {/* Error */}
        {aiError && (
          <div className="rounded-lg bg-danger-bg px-2 py-1 text-[10px] text-danger">
            {aiError}
          </div>
        )}
      </div>

      {/* Link Referensi */}
      <label className="flex flex-col gap-1 text-xs text-sub">
        <span className="font-medium">Link Referensi</span>
        <input
          type="url"
          value={form.link_ref}
          onChange={(e) => set("link_ref", e.target.value)}
          placeholder="https://..."
          className={inputCls}
        />
      </label>

      {/* Footer */}
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <button
          type="submit"
          disabled={!form.title.trim()}
          className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-sub transition hover:bg-slate-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
