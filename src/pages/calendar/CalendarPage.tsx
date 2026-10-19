import { useMemo, useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  Check,
  CalendarDays,
  Clock,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import {
  Card,
  Pill,
  BrandDot,
  PlatformIcon,
  KpiCard,
  Modal,
  ConfirmDialog,
  SectionHeader,
} from "@/components/ui";
import {
  ContentForm,
  type ContentFormValues,
} from "@/components/forms/ContentForm";
import { ContentDetailModal } from "@/components/forms/ContentDetailModal";
import { BRANDS, PRODUCTION_STATUSES, statusStyle } from "@/lib/constants";
import { fmtDate, isToday, isOverdue, relativeDay } from "@/lib/format";
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

  const [activeBrand, setActiveBrand] = useState<string>(BRANDS[0].id);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);
  const [publishItem, setPublishItem] = useState<ContentItem | null>(null);

  // Data
  const query = useContentItems({ workflow_stage: "calendar" });
  const updateMut = useUpdateContent();
  const deleteMut = useDeleteContent();
  const moveMut = useMoveStage();

  const items = query.data ?? [];

  // ── Filter per Brand Aktif ──
  const filtered = useMemo(() => {
    return items
      .filter((p) => p.brand_id === activeBrand)
      .sort((a, b) => {
        const da = a.planned_date ?? "9999";
        const db = b.planned_date ?? "9999";
        return da.localeCompare(db);
      });
  }, [items, activeBrand]);

  // ── 🎯 Statistik KESELURUHAN (semua brand) ──
  const globalStats = useMemo(() => {
    const total = items.length;
    const today = items.filter((it) => isToday(it.planned_date)).length;
    const overdue = items.filter(
      (it) =>
        isOverdue(it.planned_date) && it.production_status !== "Siap Publikasi",
    ).length;
    return { total, today, overdue };
  }, [items]);

  // ── Hitung jumlah konten per brand (untuk badge tab) ──
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BRANDS.forEach((b) => {
      counts[b.id] = items.filter((it) => it.brand_id === b.id).length;
    });
    return counts;
  }, [items]);

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
          concept: values.concept || null,
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
          shoot_date: values.shoot_date || null,
          talent_count: Number(values.talent_count) || 0,
        },
      });
      push("Perubahan disimpan");
      setEditing(null);
    } catch (err) {
      push(`Gagal: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  async function handleDelete(id: string) {
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

  const activeBrandObj = BRANDS.find((b) => b.id === activeBrand);

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Kalender Konten"
        desc="Kelola status proses produksi dan publikasikan konten."
      />

      {/* ── 🎯 Statistik Global (Semua Brand) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={BarChart3}
          label="Total Konten"
          value={globalStats.total}
          sub="Semua brand di kalender"
          iconColor="#2F5CFF"
          iconBg="#EEF2FF"
        />
        <KpiCard
          icon={Clock}
          label="Konten Hari Ini"
          value={globalStats.today}
          sub="Jadwal hari ini"
          iconColor="#16A34A"
          iconBg="#EAFBF1"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Terlewat"
          value={globalStats.overdue}
          sub={
            globalStats.overdue > 0
              ? "Perlu perhatian segera"
              : "Tidak ada yang terlewat"
          }
          iconColor={globalStats.overdue > 0 ? "#DC2626" : "#5B6478"}
          iconBg={globalStats.overdue > 0 ? "#FDECEC" : "#F1F5F9"}
        />
      </div>

      {/* ── Tab Brand ── */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-line bg-white p-1.5">
        {BRANDS.map((brand) => {
          const active = activeBrand === brand.id;
          return (
            <button
              key={brand.id}
              onClick={() => setActiveBrand(brand.id)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition"
              style={{
                backgroundColor: active ? brand.color : "transparent",
                color: active ? "#fff" : "#5B6478",
              }}
            >
              <span
                className="hidden h-2 w-2 shrink-0 rounded-full sm:inline-block"
                style={{ backgroundColor: active ? "#fff" : brand.color }}
              />
              <span className="truncate">{brand.name}</span>
              <span
                className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: active
                    ? "rgba(255,255,255,0.25)"
                    : `${brand.color}20`,
                  color: active ? "#fff" : brand.color,
                }}
              >
                {brandCounts[brand.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Loading ── */}
      {query.isLoading && (
        <Card className="p-12 text-center text-sm text-sub">Memuat…</Card>
      )}

      {/* ── Empty State ── */}
      {!query.isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarDays className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">
            Belum ada konten untuk {activeBrandObj?.name}
          </div>
          <p className="mt-1 text-xs text-sub">
            Pindahkan konten dari Perencanaan untuk mulai produksi.
          </p>
        </Card>
      )}

      {/* ── Grid Card Konten ── */}
      {!query.isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const brand = BRANDS.find((b) => b.id === p.brand_id);
            const st = statusStyle(p.production_status);

            return (
              <Card
                key={p.id}
                className="flex flex-col gap-3 p-4 transition hover:shadow-md"
              >
                {/* Header: Brand & Tanggal */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-sub">
                    <BrandDot id={p.brand_id} />
                    {brand?.name ?? p.brand_id}
                  </span>
                </div>

                {/* Judul */}
                <div className="line-clamp-2 text-sm font-semibold">
                  {p.title}
                </div>

                {/* Format & Platform */}
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

                {/* Jadwal */}
                {(() => {
                  const late =
                    isOverdue(p.planned_date) &&
                    p.production_status !== "Siap Publikasi";
                  const today = isToday(p.planned_date);
                  const color = late
                    ? "#DC2626"
                    : today
                      ? "#D97706"
                      : "#2F5CFF";
                  const bg = late ? "#FDECEC" : today ? "#FEF6E7" : "#EEF2FF";
                  const long: Intl.DateTimeFormatOptions = {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  };
                  return (
                    <div
                      className="flex flex-col gap-1 rounded-lg px-3 py-2"
                      style={{ backgroundColor: bg }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color }}
                        >
                          {p.planned_date
                            ? `📅 Akan dipublikasi ${fmtDate(p.planned_date, long)}`
                            : "📅 Tanggal publish belum ditentukan"}
                        </span>
                        {p.planned_date && (
                          <span
                            className="shrink-0 text-[10px] font-semibold"
                            style={{ color }}
                          >
                            {relativeDay(p.planned_date)}
                          </span>
                        )}
                      </div>
                      {p.shoot_date && (
                        <div className="text-[11px] text-sub">
                          🎬 Take: {fmtDate(p.shoot_date, long)}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Dibuat Oleh */}
                <div className="text-[10px] text-sub">
                  👤 Dibuat oleh {p.created_by_name ?? "Unknown"}
                </div>

                {/* Dropdown Status */}
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
                    onClick={() => setDeleteItem(p)}
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
              concept: editing.concept ?? "",
              caption: editing.caption ?? "",
              cta: editing.cta ?? "",
              link_ref: editing.link_ref ?? "",
              talent_count: String(editing.talent_count ?? 0),
              shoot_date: editing.shoot_date ?? "",
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
      <ConfirmDialog
        open={!!deleteItem}
        itemName={deleteItem?.title}
        message="Konten akan dihapus permanen dari Kalender."
        loading={deleteMut.isPending}
        onCancel={() => setDeleteItem(null)}
        onConfirm={async () => {
          if (!deleteItem) return;
          await handleDelete(deleteItem.id);
          setDeleteItem(null);
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
