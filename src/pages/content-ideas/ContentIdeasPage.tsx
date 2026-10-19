import { useMemo, useState } from "react";
import {
  Lightbulb,
  Plus,
  Eye,
  Trash2,
  MoveRight,
  Wand2,
  Search,
  Sparkles,
  Loader2,
  Library,
  Bookmark,
  X,
} from "lucide-react";
import {
  Card,
  Pill,
  BrandDot,
  Select,
  Modal,
  SectionHeader,
  ConfirmDialog,
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
import {
  useIdeaBank,
  useSaveToBank,
  useDeleteFromBank,
  useSendFromBankToPlanning,
  type BankIdea,
} from "@/hooks/useIdeaBank";
import { useGenerateIdeas, useGenerateCaption } from "@/hooks/useAi";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/services/supabase/client";
import type { ContentIdeaInput } from "@/types/content";

type Tab = "draft" | "bank";

interface DraftIdea extends ContentIdeaInput {
  _localId: string;
  _source: "AI" | "manual";
}

// ─────────────────────────────────────────────────────────
// Komponen utama
// ─────────────────────────────────────────────────────────
export function ContentIdeasPage() {
  const { push, toasts } = useToast();

  const [tab, setTab] = useState<Tab>("draft");
  const [filterBrand, setFilterBrand] = useState("all");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<DraftIdea[]>([]);

  // Bank ide
  const bankQuery = useIdeaBank();
  const bankIdeas = bankQuery.data ?? [];
  const saveToBank = useSaveToBank();
  const deleteFromBank = useDeleteFromBank();
  const sendFromBank = useSendFromBankToPlanning();

  // AI
  const generateIdeas = useGenerateIdeas();

  // Modals
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [sendItem, setSendItem] = useState<
    { type: "draft"; data: DraftIdea } | { type: "bank"; data: BankIdea } | null
  >(null);
  const [showManual, setShowManual] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [deleteBank, setDeleteBank] = useState<BankIdea | null>(null);
  const [discardDraft, setDiscardDraft] = useState<DraftIdea | null>(null);

  // Filter bank
  const filteredBank = useMemo(() => {
    return bankIdeas.filter((it) => {
      if (filterBrand !== "all" && it.brand_id !== filterBrand) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          it.title.toLowerCase().includes(q) ||
          (it.hook ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bankIdeas, filterBrand, search]);

  // ── Handlers ──────────────────────────────────────

  /** Generate ide AI untuk brand & parameter tertentu */
  async function handleGenerateIdeas(input: {
    brandId: string;
    platform: Platform;
    format: string;
    objective: Objective;
    style: string;
  }) {
    const brand = BRANDS.find((b) => b.id === input.brandId);
    if (!brand) {
      push("Brand tidak ditemukan");
      return;
    }

    try {
      const aiIdeas = await generateIdeas.mutateAsync({
        brand: brand.name,
        category: brand.category,
        platform: input.platform,
        format: input.format,
        objective: input.objective,
        style: input.style,
      });

      const newDrafts: DraftIdea[] = aiIdeas.map((idea, i) => ({
        _localId: `ai-${Date.now()}-${i}`,
        _source: "AI",
        brand_id: brand.id,
        title: idea.title,
        hook: idea.hook,
        concept: idea.concept,
        caption: idea.caption,
        cta: idea.cta,
        audience: idea.audience,
        content_pillar: idea.pillar,
        platform: input.platform,
        format: input.format,
        objective: input.objective,
        style: input.style,
        source: "AI",
        reason: "Dihasilkan oleh AI.",
      }));

      setDrafts((d) => [...newDrafts, ...d]);
      setTab("draft");
      setShowGenerate(false);
      push(
        `${newDrafts.length} ide AI untuk ${brand.name} — review & simpan ke bank`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal generate";
      push(`AI gagal: ${msg}`);
    }
  }

  async function handleSaveToBank(draft: DraftIdea) {
    try {
      await saveToBank.mutateAsync(draft);
      setDrafts((d) => d.filter((x) => x._localId !== draft._localId));
      push(`"${draft.title.substring(0, 30)}..." disimpan ke bank`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal simpan";
      push(`Gagal: ${msg}`);
    }
  }

  function handleDiscardDraft(localId: string) {
    setDrafts((d) => d.filter((x) => x._localId !== localId));
  }

  async function handleDeleteFromBank(id: string) {
    try {
      await deleteFromBank.mutateAsync(id);
      push("Ide dihapus dari bank");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal hapus";
      push(`Gagal: ${msg}`);
    }
  }

  async function handleSendDraftToPlanning(draft: DraftIdea) {
    try {
      // 🎯 Ambil email user yang login
      const { data: authData } = await supabase.auth.getUser();
      const userEmail = authData?.user?.email ?? null;

      const { error } = await supabase.from("content_items").insert({
        brand_id: draft.brand_id,
        title: draft.title,
        hook: draft.hook,
        concept: draft.concept,
        caption: draft.caption,
        cta: draft.cta,
        visual_notes: draft.visual_notes,
        audience: draft.audience,
        hashtags: draft.hashtags ?? [],
        content_pillar: draft.content_pillar,
        platform: draft.platform,
        format: draft.format,
        objective: draft.objective,
        style: draft.style,
        production_status: "Direncanakan",
        workflow_stage: "planning",
        planned_date: null,
        duration_seconds: draft.duration_seconds,
        reason: draft.reason,
        created_by_name: userEmail, // 🎯 TAMBAHKAN BARIS INI
      });
      if (error) throw error;

      setDrafts((d) => d.filter((x) => x._localId !== draft._localId));
      push(`"${draft.title.substring(0, 30)}..." dikirim ke Perencanaan`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal kirim";
      push(`Gagal: ${msg}`);
    }
  }

  async function handleSendBankToPlanning(bankIdea: BankIdea) {
    try {
      await sendFromBank.mutateAsync({ bankIdea });
      push(`"${bankIdea.title.substring(0, 30)}..." dipindah ke Perencanaan`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal kirim";
      push(`Gagal: ${msg}`);
    }
  }

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Ide Konten"
        desc="Generate ide dengan AI, review, simpan ke bank."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowGenerate(true)}
              disabled={generateIdeas.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-ai px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {generateIdeas.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin-slow" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generateIdeas.isPending ? "AI Berpikir…" : "Buat 3 Ide AI"}
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

      {/* Tab navigation */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab("draft")}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition"
              style={{
                backgroundColor: tab === "draft" ? "#EEF2FF" : "transparent",
                color: tab === "draft" ? "#2F5CFF" : "#5B6478",
                border: `1px solid ${tab === "draft" ? "#2F5CFF" : "#E7E9F0"}`,
              }}
            >
              <Lightbulb className="h-4 w-4" />
              Draft
              {drafts.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-white">
                  {drafts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("bank")}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition"
              style={{
                backgroundColor: tab === "bank" ? "#F5F3FF" : "transparent",
                color: tab === "bank" ? "#7C3AED" : "#5B6478",
                border: `1px solid ${tab === "bank" ? "#7C3AED" : "#E7E9F0"}`,
              }}
            >
              <Library className="h-4 w-4" />
              Bank Ide
              {bankIdeas.length > 0 && (
                <span
                  className="ml-1 rounded-full px-1.5 text-[10px]"
                  style={{ backgroundColor: "#7C3AED", color: "#fff" }}
                >
                  {bankIdeas.length}
                </span>
              )}
            </button>
          </div>

          {tab === "bank" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sub" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari di bank..."
                  className="w-44 rounded-lg border border-line bg-white py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
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
            </div>
          )}
        </div>

        {tab === "draft" && drafts.length > 0 && (
          <div className="mt-3 rounded-lg bg-ai-bg px-3 py-2 text-xs text-ink">
            💡 Ide di bawah <strong>belum tersimpan</strong>. Klik{" "}
            <strong>Simpan</strong> untuk menyimpan ke bank, <strong>✕</strong>{" "}
            untuk membuang, atau <strong>Rencana</strong> untuk langsung kirim
            ke Perencanaan.
          </div>
        )}

        {tab === "bank" && (
          <div className="mt-3 rounded-lg bg-primary-light px-3 py-2 text-xs text-primary">
            📚 Ide di bank adalah <strong>staging area</strong>. Setelah dikirim
            ke Rencana, ide akan <strong>pindah</strong> (tidak lagi di bank).
            Generate ulang kalau butuh ide baru.
          </div>
        )}
      </Card>

      {/* ── TAB: DRAFT ── */}
      {tab === "draft" && (
        <>
          {drafts.length === 0 ? (
            <Card className="p-12 text-center">
              <Lightbulb className="mx-auto mb-3 h-10 w-10 text-line" />
              <div className="text-sm font-semibold text-ink">
                Belum ada draft ide
              </div>
              <p className="mt-1 text-xs text-sub">
                Klik <strong>Buat 3 Ide AI</strong> untuk generate dengan AI,
                atau <strong>Tambah Manual</strong> untuk input sendiri.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
              {drafts.map((draft) => {
                const brand = BRANDS.find((b) => b.id === draft.brand_id);
                return (
                  <Card
                    key={draft._localId}
                    className="flex flex-col gap-3 border-2 border-dashed p-4"
                    style={{ borderColor: "rgba(124,58,237,0.4)" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-sub">
                        <BrandDot id={draft.brand_id} />
                        {brand?.name ?? draft.brand_id}
                      </span>
                      <div className="flex items-center gap-1">
                        {draft._source === "AI" && (
                          <Pill tone="purple" className="!text-[10px]">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI
                          </Pill>
                        )}
                        {draft._source === "manual" && (
                          <Pill tone="neutral" className="!text-[10px]">
                            Manual
                          </Pill>
                        )}
                        <button
                          onClick={() => setDiscardDraft(draft)}
                          className="rounded p-1 text-sub transition hover:bg-danger-bg hover:text-danger"
                          title="Buang draft"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="line-clamp-2 text-sm font-semibold">
                      {draft.title}
                    </div>

                    {draft.hook && (
                      <div className="line-clamp-2 rounded-lg bg-bg px-3 py-2 text-xs italic text-sub">
                        "{draft.hook}"
                      </div>
                    )}

                    <div
                      className="rounded-lg px-2 py-1 text-[10px] font-medium"
                      style={{
                        backgroundColor: "#FEF6E7",
                        color: "#D97706",
                      }}
                    >
                      ⚠️ Belum disimpan
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() =>
                          setDetail(draft as unknown as Record<string, unknown>)
                        }
                        className="flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-[11px] font-medium text-ai transition hover:bg-ai-bg"
                      >
                        <Eye className="h-3 w-3" />
                        Detail
                      </button>
                      <button
                        onClick={() => handleSaveToBank(draft)}
                        disabled={saveToBank.isPending}
                        className="flex items-center justify-center gap-1 rounded-lg bg-ai py-2 text-[11px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                        <Bookmark className="h-3 w-3" />
                        Simpan
                      </button>
                      <button
                        onClick={() =>
                          setSendItem({ type: "draft", data: draft })
                        }
                        className="flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-[11px] font-medium text-white transition hover:opacity-90"
                      >
                        <MoveRight className="h-3 w-3" />
                        Rencana
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB: BANK IDE ── */}
      {tab === "bank" && (
        <>
          {bankQuery.isLoading && (
            <Card className="p-12 text-center text-sm text-sub">
              Memuat bank ide…
            </Card>
          )}

          {!bankQuery.isLoading && filteredBank.length === 0 && (
            <Card className="p-12 text-center">
              <Library className="mx-auto mb-3 h-10 w-10 text-line" />
              <div className="text-sm font-semibold text-ink">
                {bankIdeas.length === 0
                  ? "Bank ide masih kosong"
                  : "Tidak ada ide dengan filter ini"}
              </div>
              <p className="mt-1 text-xs text-sub">
                {bankIdeas.length === 0
                  ? "Generate ide di tab Draft, lalu simpan yang bagus ke bank."
                  : "Coba ubah filter atau kata kunci."}
              </p>
            </Card>
          )}

          {filteredBank.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBank.map((idea) => {
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
                      {idea.source === "AI" && (
                        <Pill tone="purple" className="!text-[10px]">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI
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

                    <div className="text-[10px] text-sub">
                      👤 {idea.created_by_name ?? "Unknown"}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() =>
                          setDetail(idea as unknown as Record<string, unknown>)
                        }
                        className="flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-[11px] font-medium text-ai transition hover:bg-ai-bg"
                      >
                        <Eye className="h-3 w-3" />
                        Detail
                      </button>
                      <button
                        onClick={() => setDeleteBank(idea)}
                        className="flex items-center justify-center gap-1 rounded-lg border border-danger-bg py-2 text-[11px] font-medium text-danger transition hover:bg-danger-bg"
                      >
                        <Trash2 className="h-3 w-3" />
                        Hapus
                      </button>
                      <button
                        onClick={() =>
                          setSendItem({ type: "bank", data: idea })
                        }
                        className="flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-[11px] font-medium text-white transition hover:opacity-90"
                      >
                        <MoveRight className="h-3 w-3" />
                        Rencana
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modals ── */}
      {detail && (
        <IdeaDetailModal idea={detail} onClose={() => setDetail(null)} />
      )}

      {sendItem && (
        <SendToPlanningModal
          title={sendItem.data.title}
          brandId={sendItem.data.brand_id}
          platform={sendItem.data.platform}
          format={sendItem.data.format}
          fromBank={sendItem.type === "bank"}
          onClose={() => setSendItem(null)}
          onConfirm={async () => {
            if (sendItem.type === "draft") {
              await handleSendDraftToPlanning(sendItem.data);
            } else {
              await handleSendBankToPlanning(sendItem.data);
            }
            setSendItem(null);
          }}
          loading={sendItem.type === "bank" ? sendFromBank.isPending : false}
        />
      )}

      {showManual && (
        <ManualIdeaModal
          onClose={() => setShowManual(false)}
          onSave={(input) => {
            const draft: DraftIdea = {
              _localId: `manual-${Date.now()}`,
              _source: "manual",
              ...input,
            };
            setDrafts((d) => [draft, ...d]);
            setShowManual(false);
            setTab("draft");
            push("Ide ditambahkan ke draft — review & simpan ke bank");
          }}
        />
      )}

      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onGenerate={handleGenerateIdeas}
          loading={generateIdeas.isPending}
        />
      )}

      <ConfirmDialog
        open={!!deleteBank}
        itemName={deleteBank?.title}
        message="Ide akan dihapus permanen dari Bank Ide."
        loading={deleteFromBank.isPending}
        onCancel={() => setDeleteBank(null)}
        onConfirm={async () => {
          if (!deleteBank) return;
          await handleDeleteFromBank(deleteBank.id);
          setDeleteBank(null);
        }}
      />

      <ConfirmDialog
        open={!!discardDraft}
        title="Konfirmasi Buang Draft"
        itemName={discardDraft?.title}
        message="Draft belum tersimpan, jadi tidak bisa dikembalikan."
        confirmLabel="Ya, Buang"
        onCancel={() => setDiscardDraft(null)}
        onConfirm={() => {
          if (discardDraft) handleDiscardDraft(discardDraft._localId);
          setDiscardDraft(null);
        }}
      />

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
// Modal: Generate Ide AI — pilih brand & parameter
// ─────────────────────────────────────────────────────────
function GenerateModal({
  onClose,
  onGenerate,
  loading,
}: {
  onClose: () => void;
  onGenerate: (input: {
    brandId: string;
    platform: Platform;
    format: string;
    objective: Objective;
    style: string;
  }) => void;
  loading: boolean;
}) {
  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const brand = BRANDS.find((b) => b.id === brandId)!;
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [format, setFormat] = useState(FORMATS.Instagram[0]);
  const [objective, setObjective] = useState<Objective>("Jangkauan");
  const [style, setStyle] = useState(CONTENT_STYLES[0]);

  function handleBrandChange(id: string) {
    setBrandId(id);
  }

  function handlePlatformChange(p: string) {
    const pl = p as Platform;
    setPlatform(pl);
    setFormat(FORMATS[pl][0]);
  }

  function handleSubmit() {
    onGenerate({ brandId, platform, format, objective, style });
  }

  return (
    <Modal
      open
      onClose={loading ? () => {} : onClose}
      title="Buat 3 Ide dengan AI"
      wide
    >
      <div className="flex flex-col gap-4 text-sm">
        {/* Info */}
        <div
          className="rounded-xl border p-3 text-xs"
          style={{ borderColor: "#C7D2FE", backgroundColor: "#F5F3FF" }}
        >
          ✨ AI akan generate <strong>3 ide konten</strong> untuk brand yang
          Anda pilih, berdasarkan parameter di bawah.
        </div>

        {/* Brand */}
        <Select
          label="Brand *"
          value={brandId}
          onChange={handleBrandChange}
          options={BRANDS.map((b) => ({ value: b.id, label: b.name }))}
        />

        {/* Platform + Format */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Platform"
            value={platform}
            onChange={handlePlatformChange}
            options={PLATFORMS}
          />
          <Select
            label="Format"
            value={format}
            onChange={setFormat}
            options={FORMATS[platform]}
          />
        </div>

        {/* Objective + Style */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tujuan"
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

        {/* Preview brand info */}
        <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-sub">
          <div className="mb-1 font-medium text-ink">Info brand:</div>
          <div>
            <strong>{brand.name}</strong> — {brand.category}
          </div>
          <div className="mt-1">
            <strong>Pilar:</strong> {brand.pillars.join(" · ")}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ai py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin-slow" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Buat 3 Ide
              </>
            )}
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
// Modal: Detail Ide
// ─────────────────────────────────────────────────────────
function IdeaDetailModal({
  idea,
  onClose,
}: {
  idea: Record<string, unknown>;
  onClose: () => void;
}) {
  const brand = BRANDS.find((b) => b.id === idea.brand_id);
  return (
    <Modal
      open
      onClose={onClose}
      title={(idea.title as string) ?? "Detail Ide"}
      wide
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Info label="Brand" value={brand?.name ?? String(idea.brand_id)} />
          <Info label="Platform" value={(idea.platform as string) ?? "-"} />
          <Info label="Format" value={(idea.format as string) ?? "-"} />
          <Info label="Objective" value={(idea.objective as string) ?? "-"} />
        </div>
        {Boolean(idea.hook) && (
          <Block label="Hook" italic>
            {String(idea.hook)}
          </Block>
        )}
        {Boolean(idea.concept) && (
          <Block label="Konsep">{String(idea.concept)}</Block>
        )}
        {Boolean(idea.caption) && (
          <Block label="Caption">{String(idea.caption)}</Block>
        )}
        {Boolean(idea.cta) && <Block label="CTA">{String(idea.cta)}</Block>}
        {Boolean(idea.audience) && (
          <Block label="Audiens">{String(idea.audience)}</Block>
        )}
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
  title,
  brandId,
  platform,
  format,
  fromBank = false, // ← tambah prop ini
  onClose,
  onConfirm,
  loading,
}: {
  title: string;
  brandId: string;
  platform?: string | null;
  format?: string | null;
  fromBank?: boolean; // ← tambah
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const brand = BRANDS.find((b) => b.id === brandId);

  return (
    <Modal open onClose={onClose} title="Kirim ke Perencanaan">
      <div className="flex flex-col gap-4 text-sm">
        <div className="rounded-xl border border-line p-4">
          <div className="mb-2 text-xs font-medium text-sub">Konten:</div>
          <div className="flex items-center gap-2">
            <BrandDot id={brandId} />
            <span className="font-semibold">{title}</span>
          </div>
          <div className="mt-1 text-xs text-sub">
            {brand?.name} · {platform} · {format}
          </div>
        </div>
        {fromBank && (
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{
              borderColor: "#FCD34D",
              backgroundColor: "#FFFBEB",
              color: "#92400E",
            }}
          >
            ⚠️ Ide ini akan <strong>dipindah</strong> dari Bank Ide ke
            Perencanaan. Setelah dipindah, tidak bisa dikembalikan ke bank.
          </div>
        )}
        <p className="text-xs text-sub">
          Tanggal take dan publish ditentukan nanti, saat konten dipindah ke
          Kalender.
        </p>

        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={() => onConfirm()}
            disabled={loading}
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
  const [aiError, setAiError] = useState<string | null>(null);

  // 🎯 State untuk generate konsep & caption
  const [conceptLoading, setConceptLoading] = useState(false);
  const [captionLoading, setCaptionLoading] = useState(false);

  const genCaption = useGenerateCaption();

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

  // 🎯 Generate Konsep AI
  async function handleGenerateConcept() {
    if (!title.trim()) {
      setAiError("Isi judul dulu");
      return;
    }
    setAiError(null);
    setConceptLoading(true);
    try {
      const result = await genCaption.mutateAsync({
        brand: brand.name,
        title,
        hook: hook || undefined,
        platform,
        pillar,
        mode: "concept",
        format,
        objective,
      } as any);
      setConcept(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal generate";
      setAiError(msg);
    } finally {
      setConceptLoading(false);
    }
  }

  // 🎯 Generate Caption AI (sudah ada sebelumnya)
  async function handleGenerateCaption() {
    if (!title.trim()) {
      setAiError("Isi judul dulu");
      return;
    }
    setAiError(null);
    setCaptionLoading(true);
    try {
      const result = await genCaption.mutateAsync({
        brand: brand.name,
        title,
        hook: hook || undefined,
        platform,
        pillar,
      });
      setCaption(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal generate";
      setAiError(msg);
    } finally {
      setCaptionLoading(false);
    }
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

        {/* 🎯 Konsep dengan Generate AI */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-sub">Konsep</span>
            <button
              type="button"
              onClick={handleGenerateConcept}
              disabled={conceptLoading || !title.trim()}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition hover:bg-ai-bg disabled:opacity-60"
              style={{ borderColor: "#C7D2FE", color: "#7C3AED" }}
            >
              {conceptLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin-slow" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  Generate AI
                </>
              )}
            </button>
          </div>
          <textarea
            rows={3}
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Konsep/isi konten (2-3 kalimat) — atau klik 'Generate AI' di atas"
            className={inputCls}
            style={conceptLoading ? { opacity: 0.6 } : undefined}
            disabled={conceptLoading}
          />
        </div>

        {/* Caption dengan Generate AI */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-sub">Caption</span>
            <button
              type="button"
              onClick={handleGenerateCaption}
              disabled={captionLoading || !title.trim()}
              className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition hover:bg-ai-bg disabled:opacity-60"
              style={{ borderColor: "#C7D2FE", color: "#7C3AED" }}
            >
              {captionLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin-slow" />
                  Generating…
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  Generate AI
                </>
              )}
            </button>
          </div>
          <textarea
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption konten... (atau klik 'Generate AI')"
            className={inputCls}
            style={captionLoading ? { opacity: 0.6 } : undefined}
            disabled={captionLoading}
          />
          {aiError && (
            <div className="rounded-lg bg-danger-bg px-2 py-1 text-[10px] text-danger">
              {aiError}
            </div>
          )}
        </div>

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
