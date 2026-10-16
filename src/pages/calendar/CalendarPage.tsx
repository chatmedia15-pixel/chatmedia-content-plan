import { useMemo, useState } from "react";
import { Film, Eye, Edit, Trash2, Check, CalendarDays } from "lucide-react";
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
  ContentForm,
  type ContentFormValues,
} from "@/components/forms/ContentForm";
import { ContentDetailModal } from "@/components/forms/ContentDetailModal";
import { BRANDS, PRODUCTION_STATUSES, statusStyle } from "@/lib/constants";
import { fmtDate, cx } from "@/lib/format";
import {
  useContentItems,
  useUpdateContent,
  useDeleteContent,
  useMoveStage,
} from "@/hooks/useContentItems";
import { useToast } from "@/hooks/useToast";
import type { ContentItem } from "@/types/content";

export function CalendarPage() {
  const { push, toasts } = useToast();

  const [filterBrand, setFilterBrand] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [publishItem, setPublishItem] = useState<ContentItem | null>(null);

  // Data
  const query = useContentItems({ workflow_stage: "calendar" });
  const updateMut = useUpdateContent();
  const deleteMut = useDeleteContent();
  const moveMut = useMoveStage();

  const items = query.data ?? [];

  // ── Hitung count per status ─────────────────────
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    PRODUCTION_STATUSES.forEach((s) => (c[s] = 0));
    items.forEach((p) => {
      if (c[p.production_status] !== undefined) c[p.production_status]++;
    });
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((p) => {
        if (filterBrand !== "all" && p.brand_id !== filterBrand) return false;
        if (filterStatus !== "all" && p.production_status !== filterStatus)
          return false;
        return true;
      })
      .sort((a, b) => {
        const da = a.planned_date ?? "9999";
        const db = b.planned_date ?? "9999";
        return da.localeCompare(db);
      });
  }, [items, filterBrand, filterStatus]);

  // ── Handlers ─────────────────────────────────────
  async function handleStatusChange(item: ContentItem, newStatus: string) {
    try {
      await updateMut.mutateAsync({
        id: item.id,
        patch: { production_status: newStatus },
      });
      push(`Status: ${newStatus}`);
    } catch (err) {
      push(`Gagal: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  async function handleEdit(values: ContentFormValues) {
    if (!editing) return;
    try {
      await updateMut.mutateAsync({
        id: editing.id,
        patch: {
          brand_id: values.brand_id,
          title: values.title,
          hook: values.hook || null,
          caption: values.caption || null,
          cta: values.cta || null,
          link_ref: values.link_ref || null,
          content_pillar: values.content_pillar,
          platform: values.platform,
          format: values.format,
          objective: values.objective,
          style: values.style,
          production_status: values.production_status,
          planned_date: values.planned_date,
        },
      });
      push("Perubahan disimpan");
      setEditing(null);
    } catch (err) {
      push(`Gagal: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus konten ini dari Kalender?")) return;
    try {
      await deleteMut.mutateAsync(id);
      push("Konten dihapus");
    } catch (err) {
      push(`Gagal: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  async function handlePublish(url: string) {
    if (!publishItem) return;
    try {
      await moveMut.mutateAsync({
        id: publishItem.id,
        stage: "published",
        publishedUrl: url || undefined,
      });
      push(`"${publishItem.title}" dipublikasikan`);
      setPublishItem(null);
    } catch (err) {
      push(`Gagal publish: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Kalender Konten"
        desc="Kelola status proses produksi dan publikasikan konten."
      />

      {/* ── Status chips ── */}
      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Film className="h-4 w-4 text-primary" />
          Status Proses
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={cx(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
            )}
            style={{
              borderColor: filterStatus === "all" ? "#2F5CFF" : "#E7E9F0",
              backgroundColor:
                filterStatus === "all" ? "#EEF2FF" : "transparent",
              color: filterStatus === "all" ? "#2F5CFF" : "#5B6478",
            }}
          >
            Semua
            <span
              className="rounded-full px-1.5 text-[10px]"
              style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            >
              {items.length}
            </span>
          </button>

          {PRODUCTION_STATUSES.map((s) => {
            const st = statusStyle(s);
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                style={{
                  borderColor: active ? st.fg : "#E7E9F0",
                  backgroundColor: active ? st.bg : "transparent",
                  color: active ? st.fg : "#5B6478",
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: st.dot }}
                />
                {s}
                <span
                  className="rounded-full px-1.5 text-[10px]"
                  style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
                >
                  {statusCounts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Filter brand ── */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filterBrand}
            onChange={setFilterBrand}
            options={[
              { value: "all", label: "Semua Brand" },
              ...BRANDS.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <Pill tone="blue">{filtered.length} konten</Pill>
        </div>
      </Card>

      {/* ── Loading ── */}
      {query.isLoading && (
        <Card className="p-12 text-center text-sm text-sub">Memuat…</Card>
      )}

      {/* ── Empty state ── */}
      {!query.isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">
            {items.length === 0
              ? "Belum ada konten di Kalender"
              : "Tidak ada konten dengan filter ini"}
          </div>
          <p className="mt-1 text-xs text-sub">
            {items.length === 0
              ? "Pindahkan konten dari Perencanaan untuk mulai produksi."
              : "Coba ubah filter brand atau status."}
          </p>
        </Card>
      )}

      {/* ── List kartu ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const brand = BRANDS.find((b) => b.id === p.brand_id);
            const st = statusStyle(p.production_status);

            return (
              <Card
                key={p.id}
                className="flex flex-col gap-3 p-4 transition hover:shadow-md"
              >
                {/* Header: brand + tanggal */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-sub">
                    <BrandDot id={p.brand_id} />
                    {brand?.name ?? p.brand_id}
                  </span>
                  {p.planned_date && (
                    <Pill tone="blue" className="!text-[10px]">
                      {fmtDate(p.planned_date, {
                        day: "2-digit",
                        month: "short",
                      })}
                    </Pill>
                  )}
                </div>

                {/* Judul */}
                <div className="line-clamp-2 text-sm font-semibold">
                  {p.title}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {p.platform && (
                    <Pill tone="blue" className="!text-[10px]">
                      <PlatformIcon platform={p.platform} className="h-3 w-3" />
                      {p.platform}
                    </Pill>
                  )}
                  {p.format && (
                    <Pill tone="purple" className="!text-[10px]">
                      {p.format}
                    </Pill>
                  )}
                </div>

                {/* Dropdown status */}
                <div className="flex items-center justify-between rounded-lg border border-line bg-slate-50 px-3 py-2">
                  <span className="text-[10px] font-medium text-sub">
                    Status
                  </span>
                  <select
                    value={p.production_status}
                    onChange={(e) => handleStatusChange(p, e.target.value)}
                    className="cursor-pointer rounded-md border-0 px-2 py-1 text-xs font-semibold outline-none"
                    style={{ color: st.fg, backgroundColor: st.bg }}
                  >
                    {PRODUCTION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDetail(p)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-xs font-medium text-ai transition hover:bg-ai-bg"
                  >
                    <Eye className="h-3 w-3" />
                    Detail
                  </button>
                  <button
                    onClick={() => setEditing(p)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-xs font-medium text-primary transition hover:bg-primary-light"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-danger-bg py-2 text-xs font-medium text-danger transition hover:bg-danger-bg"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </button>
                  <button
                    onClick={() => setPublishItem(p)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-success py-2 text-xs font-medium text-white transition hover:opacity-90"
                  >
                    <Check className="h-3 w-3" />
                    Publish
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Modal Edit ── */}
      {editing && (
        <Modal open onClose={() => setEditing(null)} title="Edit Konten" wide>
          <ContentForm
            initial={{
              brand_id: editing.brand_id,
              platform: editing.platform,
              format: editing.format ?? "Reels",
              content_pillar: editing.content_pillar ?? "",
              objective: editing.objective ?? "Jangkauan",
              style: editing.style ?? "Edukatif",
              title: editing.title,
              hook: editing.hook ?? "",
              caption: editing.caption ?? "",
              cta: editing.cta ?? "",
              link_ref: editing.link_ref ?? "",
              production_status: editing.production_status ?? "Direncanakan",
              planned_date: editing.planned_date ?? "",
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditing(null)}
            submitLabel="Simpan"
          />
        </Modal>
      )}

      {/* ── Modal Detail ── */}
      {detail && (
        <ContentDetailModal item={detail} onClose={() => setDetail(null)} />
      )}

      {/* ── Modal Publish ── */}
      {publishItem && (
        <PublishModal
          item={publishItem}
          onClose={() => setPublishItem(null)}
          onConfirm={handlePublish}
          loading={moveMut.isPending}
        />
      )}

      {/* ── Toast ── */}
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
// Publish Modal
// ─────────────────────────────────────────────────────────
function PublishModal({
  item,
  onClose,
  onConfirm,
  loading,
}: {
  item: ContentItem;
  onClose: () => void;
  onConfirm: (url: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState("");
  const brand = BRANDS.find((b) => b.id === item.brand_id);

  return (
    <Modal
      open
      onClose={loading ? () => {} : onClose}
      title="Publikasikan Konten"
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="rounded-xl border border-line p-4">
          <div className="mb-2 text-xs font-medium text-sub">Konten:</div>
          <div className="flex items-center gap-2">
            <BrandDot id={item.brand_id} />
            <span className="font-semibold">{item.title}</span>
          </div>
          <div className="mt-1 text-xs text-sub">
            {brand?.name} · {item.platform} · {item.format}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Link Konten (opsional)</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://instagram.com/p/..."
            disabled={loading}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
          <span className="mt-1 text-[10px] text-sub">
            Boleh dikosongkan, bisa diisi nanti di halaman Konten Dipublikasi.
          </span>
        </label>

        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={() => onConfirm(url.trim())}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Memproses…" : "Konfirmasi Publish"}
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
