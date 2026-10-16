import { useMemo, useState } from "react";
import {
  Lightbulb,
  Plus,
  Wand2,
  Eye,
  Trash2,
  MoveRight,
  Search,
} from "lucide-react";
import {
  Card,
  Pill,
  BrandDot,
  PlatformIcon,
  Select,
  Modal,
  SectionHeader,
} from "@/components/ui";
import {
  BRANDS,
  PLATFORMS,
  FORMATS,
  OBJECTIVES,
  CONTENT_STYLES,
  type Platform,
  type Objective,
} from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import {
  useContentIdeas,
  useCreateIdea,
  useDeleteIdea,
  useSendIdeaToPlanning,
} from "@/hooks/useContentIdeas";
import { useToast } from "@/hooks/useToast";
import type { ContentIdea, ContentIdeaInput } from "@/types/content";

// ─────────────────────────────────────────────────────────
// Komponen utama
// ─────────────────────────────────────────────────────────
export function ContentIdeasPage() {
  const { push, toasts } = useToast();

  // Filter
  const [filterBrand, setFilterBrand] = useState("all");
  const [search, setSearch] = useState("");

  // Data dari Supabase
  const ideasQuery = useContentIdeas();
  const createIdea = useCreateIdea();
  const deleteIdea = useDeleteIdea();
  const sendToPlanning = useSendIdeaToPlanning();

  const ideas = ideasQuery.data ?? [];

  // Filter + search
  const filtered = useMemo(() => {
    return ideas.filter((idea) => {
      if (filterBrand !== "all" && idea.brand_id !== filterBrand) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          idea.title.toLowerCase().includes(q) ||
          (idea.hook ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ideas, filterBrand, search]);

  // ── Handlers ─────────────────────────────────────────
  async function handleQuickIdea() {
    const brandId = filterBrand !== "all" ? filterBrand : BRANDS[0].id;
    const brand = BRANDS.find((b) => b.id === brandId)!;
    const seed = brand.ideas[Math.floor(Math.random() * brand.ideas.length)];
    const pillar =
      brand.pillars[Math.floor(Math.random() * brand.pillars.length)];

    const input: ContentIdeaInput = {
      brand_id: brand.id,
      title: seed,
      hook: `Ini yang sering dilewatkan orang saat ${pillar.toLowerCase()}.`,
      concept: `${seed} dengan pendekatan ${pillar}. Fokus pada value yang jelas dan visual menarik.`,
      cta: "Cek link di bio.",
      audience: `Audiens ${brand.category}`,
      content_pillar: pillar,
      platform: "Instagram",
      format: "Reels",
      objective: "Jangkauan",
      style: "Edukatif",
      flow: ["Hook pembuka", "Isi inti", "Momen hasil", "CTA"],
      hashtags: [`#${brand.name.replace(/\s/g, "")}`],
      duration_seconds: 30,
      source: "template",
      reason: "Pola engagement tinggi untuk kategori ini.",
    };

    try {
      await createIdea.mutateAsync(input);
      push("Ide cepat ditambahkan");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menambah ide";
      push(`Gagal: ${msg}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus ide ini?")) return;
    try {
      await deleteIdea.mutateAsync(id);
      push("Ide dihapus");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal hapus";
      push(`Gagal: ${msg}`);
    }
  }

  async function handleSend(idea: ContentIdea, plannedDate: string) {
    try {
      await sendToPlanning.mutateAsync({ idea, plannedDate });
      push(`"${idea.title}" dikirim ke Perencanaan`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal kirim";
      push(`Gagal: ${msg}`);
    }
  }

  // State modal
  const [detail, setDetail] = useState<ContentIdea | null>(null);
  const [sendItem, setSendItem] = useState<ContentIdea | null>(null);
  const [showManual, setShowManual] = useState(false);

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Ide Konten"
        desc="Kumpulkan ide, kirim ke Perencanaan 30 Hari."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleQuickIdea}
              disabled={createIdea.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-medium text-ai transition hover:bg-ai-bg disabled:opacity-60"
            >
              <Wand2 className="h-4 w-4" />
              Ide Cepat
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Tambah Manual
            </button>
          </div>
        }
      />

      {/* Filter */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sub" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ide..."
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <Select
            value={filterBrand}
            onChange={setFilterBrand}
            options={[
              { value: "all", label: "Semua Brand" },
              ...BRANDS.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <Pill tone="blue">{filtered.length} ide</Pill>
        </div>
      </Card>

      {/* Empty */}
      {ideasQuery.isLoading && (
        <Card className="p-12 text-center text-sm text-sub">Memuat ide…</Card>
      )}

      {!ideasQuery.isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <Lightbulb className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">Belum ada ide</div>
          <p className="mt-1 text-xs text-sub">
            Klik "Ide Cepat" untuk generate otomatis, atau "Tambah Manual" untuk
            input sendiri.
          </p>
        </Card>
      )}

      {/* List */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((idea) => {
            const brand = BRANDS.find((b) => b.id === idea.brand_id);
            return (
              <Card
                key={idea.id}
                className="flex flex-col gap-3 p-4 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-sub">
                    <BrandDot id={idea.brand_id} />
                    {brand?.name ?? idea.brand_id}
                  </span>
                  {idea.platform && (
                    <Pill tone="blue" className="!text-[10px]">
                      <PlatformIcon
                        platform={idea.platform}
                        className="h-3 w-3"
                      />
                      {idea.format ?? idea.platform}
                    </Pill>
                  )}
                </div>

                <div className="line-clamp-2 text-sm font-semibold">
                  {idea.title}
                </div>

                {idea.hook && (
                  <div className="line-clamp-2 rounded-lg bg-bg px-3 py-2 text-xs italic text-sub">
                    "{idea.hook}"
                  </div>
                )}

                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDetail(idea)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-xs font-medium text-ai transition hover:bg-ai-bg"
                  >
                    <Eye className="h-3 w-3" />
                    Detail
                  </button>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-danger-bg py-2 text-xs font-medium text-danger transition hover:bg-danger-bg"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </button>
                </div>

                <button
                  onClick={() => setSendItem(idea)}
                  className="flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-medium text-white transition hover:opacity-90"
                >
                  <MoveRight className="h-3 w-3" />
                  Kirim ke Perencanaan
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal detail */}
      {detail && (
        <IdeaDetailModal idea={detail} onClose={() => setDetail(null)} />
      )}

      {/* Modal kirim ke perencanaan */}
      {sendItem && (
        <SendToPlanningModal
          idea={sendItem}
          onClose={() => setSendItem(null)}
          onConfirm={async (date) => {
            await handleSend(sendItem, date);
            setSendItem(null);
          }}
          loading={sendToPlanning.isPending}
        />
      )}

      {/* Modal tambah manual */}
      {showManual && (
        <ManualIdeaModal
          onClose={() => setShowManual(false)}
          onSave={async (input) => {
            try {
              await createIdea.mutateAsync(input);
              push("Ide disimpan");
              setShowManual(false);
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Gagal simpan";
              push(`Gagal: ${msg}`);
            }
          }}
        />
      )}

      {/* Toasts */}
      {toasts.length > 0 && (
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
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Modal: Detail Ide
// ─────────────────────────────────────────────────────────
function IdeaDetailModal({
  idea,
  onClose,
}: {
  idea: ContentIdea;
  onClose: () => void;
}) {
  const brand = BRANDS.find((b) => b.id === idea.brand_id);
  return (
    <Modal open onClose={onClose} title={idea.title} wide>
      <div className="flex flex-col gap-4 text-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Info label="Brand" value={brand?.name ?? idea.brand_id} />
          <Info label="Platform" value={idea.platform ?? "-"} />
          <Info label="Format" value={idea.format ?? "-"} />
          <Info label="Objective" value={idea.objective ?? "-"} />
        </div>
        {idea.hook && (
          <Block label="Hook" italic>
            {idea.hook}
          </Block>
        )}
        {idea.concept && <Block label="Konsep">{idea.concept}</Block>}
        {idea.caption && <Block label="Caption">{idea.caption}</Block>}
        {idea.cta && <Block label="CTA">{idea.cta}</Block>}
        {idea.audience && <Block label="Audiens">{idea.audience}</Block>}
        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-sub transition hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Modal: Kirim ke Perencanaan
// ─────────────────────────────────────────────────────────
function SendToPlanningModal({
  idea,
  onClose,
  onConfirm,
  loading,
}: {
  idea: ContentIdea;
  onClose: () => void;
  onConfirm: (date: string) => void;
  loading: boolean;
}) {
  const [date, setDate] = useState(toDateInput(new Date()));
  const brand = BRANDS.find((b) => b.id === idea.brand_id);

  return (
    <Modal open onClose={onClose} title="Kirim ke Perencanaan">
      <div className="flex flex-col gap-4 text-sm">
        <div className="rounded-xl border border-line p-4">
          <div className="mb-2 text-xs font-medium text-sub">Konten:</div>
          <div className="flex items-center gap-2">
            <BrandDot id={idea.brand_id} />
            <span className="font-semibold">{idea.title}</span>
          </div>
          <div className="mt-1 text-xs text-sub">
            {brand?.name} · {idea.platform} · {idea.format}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Tanggal Rencana</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </label>

        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={() => onConfirm(date)}
            disabled={loading || !date}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Konfirmasi"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-sub disabled:opacity-60"
          >
            Batal
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Modal: Tambah Ide Manual
// ─────────────────────────────────────────────────────────
function ManualIdeaModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: ContentIdeaInput) => void;
}) {
  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const brand = BRANDS.find((b) => b.id === brandId)!;
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [format, setFormat] = useState(FORMATS.Instagram[0]);
  const [pillar, setPillar] = useState(brand.pillars[0]);
  const [objective, setObjective] = useState<Objective>("Jangkauan");
  const [style, setStyle] = useState(CONTENT_STYLES[0]);
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [concept, setConcept] = useState("");
  const [caption, setCaption] = useState("");
  const [cta, setCta] = useState("");

  function handleBrandChange(id: string) {
    const b = BRANDS.find((x) => x.id === id)!;
    setBrandId(id);
    setPillar(b.pillars[0]);
  }

  function handlePlatformChange(p: string) {
    const pl = p as Platform;
    setPlatform(pl);
    setFormat(FORMATS[pl][0]);
  }

  function submit() {
    if (!title.trim()) return;
    onSave({
      brand_id: brandId,
      title: title.trim(),
      hook: hook || null,
      concept: concept || null,
      caption: caption || null,
      cta: cta || null,
      content_pillar: pillar,
      platform,
      format,
      objective,
      style,
      source: "manual",
    });
  }

  const inputCls =
    "rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-primary";

  return (
    <Modal open onClose={onClose} title="Tambah Ide Manual" wide>
      <div className="flex flex-col gap-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Brand"
            value={brandId}
            onChange={handleBrandChange}
            options={BRANDS.map((b) => ({ value: b.id, label: b.name }))}
          />
          <Select
            label="Platform"
            value={platform}
            onChange={handlePlatformChange}
            options={PLATFORMS}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Format"
            value={format}
            onChange={setFormat}
            options={FORMATS[platform]}
          />
          <Select
            label="Pillar"
            value={pillar}
            onChange={setPillar}
            options={brand.pillars}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Objective"
            value={objective}
            onChange={(v) => setObjective(v as Objective)}
            options={OBJECTIVES}
          />
          <Select
            label="Gaya"
            value={style}
            onChange={setStyle}
            options={CONTENT_STYLES}
          />
        </div>
        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Judul *</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Hook</span>
          <textarea
            rows={2}
            value={hook}
            onChange={(e) => setHook(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Konsep</span>
          <textarea
            rows={3}
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Caption</span>
          <textarea
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">CTA</span>
          <input
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            placeholder="Cek link di bio."
            className={inputCls}
          />
        </label>

        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            Simpan
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-sub"
          >
            Batal
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-sub">
        {label}
      </div>
      <div className="text-sm font-medium text-ink">{value}</div>
    </div>
  );
}

function Block({
  label,
  children,
  italic,
}: {
  label: string;
  children: React.ReactNode;
  italic?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="mb-1 text-[10px] uppercase tracking-wide text-sub">
        {label}
      </div>
      <div
        className={`whitespace-pre-wrap break-words text-sm text-ink ${italic ? "italic" : ""}`}
      >
        {children}
      </div>
    </div>
  );
}
