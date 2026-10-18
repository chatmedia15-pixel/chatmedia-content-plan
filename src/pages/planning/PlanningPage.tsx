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
  Select,
  Modal,
  SectionHeader,
} from "@/components/ui";
import {
  ContentForm,
  type ContentFormValues,
} from "@/components/forms/ContentForm";
import { ContentDetailModal } from "@/components/forms/ContentDetailModal";
import { BRANDS } from "@/lib/constants";
import { fmtDate, cx } from "@/lib/format";
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

  const [filterBrand, setFilterBrand] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Data
  const query = useContentItems({ workflow_stage: "planning" });
  const createMut = useCreateContent();
  const updateMut = useUpdateContent();
  const deleteMut = useDeleteContent();
  const moveMut = useMoveStage();

  const items = query.data ?? [];

  const filtered = useMemo(() => {
    return items
      .filter((p) => {
        if (filterBrand !== "all" && p.brand_id !== filterBrand) return false;
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
  }, [items, filterBrand, search]);

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
        planned_date: values.planned_date,
        shoot_date: values.shoot_date || null,
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
    if (!confirm("Hapus konten ini?")) return;
    try {
      await deleteMut.mutateAsync(id);
      push("Konten dihapus");
    } catch (err) {
      push(`Gagal: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  async function handleMove(item: ContentItem) {
    try {
      await moveMut.mutateAsync({ id: item.id, stage: "calendar" });
      push(`"${item.title}" dipindah ke Kalender`);
    } catch (err) {
      push(`Gagal pindah: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

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

      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sub" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul / hook..."
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
          <Pill tone="blue">{filtered.length} konten</Pill>
        </div>
      </Card>

      {query.isLoading && (
        <Card className="p-12 text-center text-sm text-sub">Memuat…</Card>
      )}

      {!query.isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarRange className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">
            Belum ada konten di Perencanaan
          </div>
          <p className="mt-1 text-xs text-sub">
            Tambah konten manual, atau kirim ide dari halaman Ide Konten.
          </p>
        </Card>
      )}

      {filtered.length > 0 && (
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
                  {p.planned_date && (
                    <Pill tone="warn" className="!text-sm !font-semibold">
                      {fmtDate(p.planned_date, {
                        day: "2-digit",
                        month: "short",
                      })}
                    </Pill>
                  )}
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

                {p.hook && (
                  <div className="line-clamp-2 rounded-lg bg-bg px-3 py-2 text-xs italic text-sub">
                    "{p.hook}"
                  </div>
                )}
                {/* 👤 Dibuat oleh */}
                <div className="flex items-center gap-1.5 text-[10px] text-sub">
                  <span>👤</span>
                  <span className="truncate">
                    Dibuat oleh{" "}
                    <strong>{p.created_by_name ?? "Unknown"}</strong>
                  </span>
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
                    onClick={() => handleDelete(p.id)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-danger-bg py-2 text-xs font-medium text-danger transition hover:bg-danger-bg"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </button>
                  <button
                    onClick={() => handleMove(p)}
                    className={cx(
                      "flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-xs font-medium text-white transition hover:opacity-90",
                    )}
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

      {/* Modal tambah */}
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
          />
        </Modal>
      )}

      {/* Modal edit */}
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

      {/* Modal detail */}
      {detail && (
        <ContentDetailModal item={detail} onClose={() => setDetail(null)} />
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
