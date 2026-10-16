import { useState } from "react";
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

  const inputCls =
    "rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-primary";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        onSubmit(form);
      }}
      className="flex flex-col gap-3 text-sm"
    >
      {/* Baris 1: Tanggal + Brand */}
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

      {/* Baris 2: Platform + Format */}
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

      {/* Baris 3: Pillar + Objective */}
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

      {/* Baris 4: Style + Status */}
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

      {/* Caption */}
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
