import { useMemo, useState } from "react";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  MoveRight,
  Search,
  CalendarRange,
} from "lucide-react";
import {
  Card,
  Pill,
  BrandDot,
  PlatformIcon,
  Modal,
  ConfirmDialog,
  SectionHeader,
} from "@/components/ui";
import {
  ContentForm,
  type ContentFormValues,
} from "@/components/forms/ContentForm";
import { ContentDetailModal } from "@/components/forms/ContentDetailModal";
import { BRANDS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import {
  useContentItems,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  useMoveStage,
} from "@/hooks/useContentItems";
import { useToast } from "@/hooks/useToast";
import type { ContentItem } from "@/types/content";

export function PlanningPage() {
  const { push, toasts } = useToast();

  const [activeBrand, setActiveBrand] = useState<string>(BRANDS[0].id);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ContentItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [moveItem, setMoveItem] = useState<ContentItem | null>(null);

  // Data
  const query = useContentItems({ workflow_stage: "planning" });
  const createMut = useCreateContent();
  const updateMut = useUpdateContent();
  const deleteMut = useDeleteContent();
  const moveMut = useMoveStage();

  const items = query.data ?? [];

  // ── Filter per Brand Aktif + Search ──
  const filtered = useMemo(() => {
    return items
      .filter((p) => {
        if (p.brand_id !== activeBrand) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            (p.hook ?? "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const da = a.planned_date ?? "9999";
        const db = b.planned_date ?? "9999";
        return da.localeCompare(db);
      });
  }, [items, activeBrand, search]);

  // ── Hitung jumlah konten per brand ──
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BRANDS.forEach((b) => {
      counts[b.id] = items.filter((it) => it.brand_id === b.id).length;
    });
    return counts;
  }, [items]);

  // ── Handlers ─────────────────────────────────────
  async function handleAdd(values: ContentFormValues) {
    try {
      await createMut.mutateAsync({
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
        workflow_stage: "planning",
        planned_date: null,
        shoot_date: null,
        talent_count: Number(values.talent_count) || 0,
      });
      push("Konten ditambahkan");
      setShowAdd(false);
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

  async function handleMove(
    item: ContentItem,
    plannedDate: string,
    shootDate: string,
  ) {
    try {
      await updateMut.mutateAsync({
        id: item.id,
        patch: {
          planned_date: plannedDate,
          shoot_date: shootDate || null,
        },
      });
      await moveMut.mutateAsync({ id: item.id, stage: "calendar" });
      push(`"${item.title}" dipindah ke Kalender`);
      setMoveItem(null);
    } catch (err) {
      push(`Gagal pindah: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  const activeBrandObj = BRANDS.find((b) => b.id === activeBrand);

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Perencanaan 30 Hari"
        desc="Kelola rencana konten sebelum masuk ke kalender produksi."
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Tambah Konten
          </button>
        }
      />

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

      {/* ── Search ── */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sub" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Cari konten ${activeBrandObj?.name}...`}
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <Pill tone="blue">{filtered.length} konten</Pill>
        </div>
      </Card>

      {/* ── Loading ── */}
      {query.isLoading && (
        <Card className="p-12 text-center text-sm text-sub">Memuat…</Card>
      )}

      {/* ── Empty ── */}
      {!query.isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarRange className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">
            {items.filter((it) => it.brand_id === activeBrand).length === 0
              ? `Belum ada konten untuk ${activeBrandObj?.name}`
              : "Tidak ada konten dengan filter ini"}
          </div>
          <p className="mt-1 text-xs text-sub">
            Klik "Tambah Konten" atau kirim ide dari halaman Ide Konten.
          </p>
        </Card>
      )}

      {/* ── Grid Card ── */}
      {!query.isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const brand = BRANDS.find((b) => b.id === p.brand_id);
            return (
              <Card
                key={p.id}
                className="flex flex-col gap-3 p-4 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-sub">
                    <BrandDot id={p.brand_id} />
                    {brand?.name ?? p.brand_id}
                  </span>
                </div>

                <div className="line-clamp-2 text-sm font-semibold">
                  {p.title}
                </div>

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
                  {p.objective && (
                    <Pill tone="neutral" className="!text-[10px]">
                      {p.objective}
                    </Pill>
                  )}
                </div>

                <div className="text-[10px] text-sub">
                  👤 Dibuat oleh {p.created_by_name ?? "Unknown"}
                </div>

                <div className="mt-1 grid grid-cols-2 gap-2">
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
                    onClick={() => setMoveItem(p)}
                    className="flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-medium text-white transition hover:opacity-90"
                  >
                    <MoveRight className="h-3 w-3" />
                    Ke Kalender
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {showAdd && (
        <Modal
          open
          onClose={() => setShowAdd(false)}
          title="Tambah Konten"
          wide
        >
          <ContentForm
            onSubmit={handleAdd}
            onCancel={() => setShowAdd(false)}
            submitLabel="Tambah"
            hideDates
          />
        </Modal>
      )}

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
            hideDates
          />
        </Modal>
      )}

      {moveItem && (
        <MoveToCalendarModal
          item={moveItem}
          onClose={() => setMoveItem(null)}
          onConfirm={(planned, shoot) => handleMove(moveItem, planned, shoot)}
          loading={updateMut.isPending || moveMut.isPending}
        />
      )}

      {detail && (
        <ContentDetailModal item={detail} onClose={() => setDetail(null)} />
      )}

      <ConfirmDialog
        open={!!deleteItem}
        itemName={deleteItem?.title}
        message="Konten akan dihapus permanen dari Perencanaan."
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
// Modal: Pindah ke Kalender (tentukan tanggal take & publish)
// ─────────────────────────────────────────────────────────
function MoveToCalendarModal({
  item,
  onClose,
  onConfirm,
  loading,
}: {
  item: ContentItem;
  onClose: () => void;
  onConfirm: (plannedDate: string, shootDate: string) => void;
  loading: boolean;
}) {
  const [plannedDate, setPlannedDate] = useState(
    item.planned_date ?? toDateInput(new Date()),
  );
  const [shootDate, setShootDate] = useState(item.shoot_date ?? "");
  const brand = BRANDS.find((b) => b.id === item.brand_id);
  const inputCls =
    "rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60";

  return (
    <Modal
      open
      onClose={loading ? () => {} : onClose}
      title="Pindah ke Kalender"
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs text-sub">
            <span className="font-medium">Tanggal Take</span>
            <input
              type="date"
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              disabled={loading}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-sub">
            <span className="font-medium">Tanggal Publish *</span>
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              disabled={loading}
              className={inputCls}
            />
          </label>
        </div>

        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={() => onConfirm(plannedDate, shootDate)}
            disabled={loading || !plannedDate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
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
