import { useMemo, useState } from "react";
import {
  Archive,
  Eye,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
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
import { ContentDetailModal } from "@/components/forms/ContentDetailModal";
import { BRANDS } from "@/lib/constants";
import { fmtDate, monthKey, monthLabel, isValidUrl } from "@/lib/format";
import {
  useContentItems,
  useUpdateContent,
  useDeleteContent,
} from "@/hooks/useContentItems";
import { useToast } from "@/hooks/useToast";
import type { ContentItem } from "@/types/content";

export function PublishedPage() {
  const { push, toasts } = useToast();

  const [filterBrand, setFilterBrand] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<ContentItem | null>(null);
  const [editLink, setEditLink] = useState<ContentItem | null>(null);

  // Data
  const query = useContentItems({ workflow_stage: "published" });
  const updateMut = useUpdateContent();
  const deleteMut = useDeleteContent();

  const items = query.data ?? [];

  // ── Daftar bulan yang tersedia ─────────────────
  const availableMonths = useMemo(() => {
    const months: Record<string, number> = {};
    items.forEach((p) => {
      const key =
        monthKey(p.planned_date) || monthKey(p.published_at?.slice(0, 10));
      if (!key) return;
      months[key] = (months[key] ?? 0) + 1;
    });
    return Object.keys(months)
      .sort()
      .reverse()
      .map((k) => ({ value: k, label: monthLabel(k), count: months[k] }));
  }, [items]);

  const filtered = useMemo(() => {
    return items
      .filter((p) => {
        if (filterBrand !== "all" && p.brand_id !== filterBrand) return false;
        if (filterMonth !== "all") {
          const key =
            monthKey(p.planned_date) || monthKey(p.published_at?.slice(0, 10));
          if (key !== filterMonth) return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          return p.title.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const da = a.published_at ?? a.planned_date ?? "";
        const db = b.published_at ?? b.planned_date ?? "";
        return db.localeCompare(da);
      });
  }, [items, filterBrand, filterMonth, search]);

  // ── Handlers ─────────────────────────────────────
  async function handleSaveLink(url: string) {
    if (!editLink) return;
    if (url && !isValidUrl(url)) {
      push("URL tidak valid. Harus dimulai http:// atau https://");
      return;
    }
    try {
      await updateMut.mutateAsync({
        id: editLink.id,
        patch: { published_url: url || null },
      });
      push(url ? "Link tersimpan" : "Link dihapus");
      setEditLink(null);
    } catch (err) {
      push(`Gagal: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus konten ini dari arsip?")) return;
    try {
      await deleteMut.mutateAsync(id);
      push("Konten dihapus");
    } catch (err) {
      push(`Gagal: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Konten Dipublikasi"
        desc="Arsip konten yang sudah tayang di Instagram atau TikTok."
      />

      {/* Filter bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sub" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul konten..."
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <Select
            value={filterMonth}
            onChange={setFilterMonth}
            options={[
              { value: "all", label: "Semua Bulan" },
              ...availableMonths.map((m) => ({
                value: m.value,
                label: m.label,
              })),
            ]}
          />
          <Select
            value={filterBrand}
            onChange={setFilterBrand}
            options={[
              { value: "all", label: "Semua Brand" },
              ...BRANDS.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />
          <Pill tone="good">{filtered.length} live</Pill>
        </div>
      </Card>

      {/* Loading */}
      {query.isLoading && (
        <Card className="p-12 text-center text-sm text-sub">Memuat…</Card>
      )}

      {/* Empty */}
      {!query.isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <Archive className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">
            {items.length === 0
              ? "Belum ada konten dipublikasi"
              : "Tidak ada konten dengan filter ini"}
          </div>
          <p className="mt-1 text-xs text-sub">
            {items.length === 0
              ? "Publish konten dari halaman Kalender untuk melihatnya di sini."
              : "Coba ubah filter bulan atau brand."}
          </p>
        </Card>
      )}

      {/* List */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const brand = BRANDS.find((b) => b.id === p.brand_id);
            const date = p.published_at ?? p.planned_date;

            return (
              <Card
                key={p.id}
                className="flex flex-col gap-3 p-4 transition hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-sub">
                    <BrandDot id={p.brand_id} />
                    {brand?.name ?? p.brand_id}
                  </span>
                  <Pill tone="good">Live</Pill>
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

                {/* Tanggal */}
                {date && (
                  <div className="text-[11px] text-sub">
                    Dipublikasi: {fmtDate(date)}
                  </div>
                )}

                {/* Link live */}
                {p.published_url ? (
                  <a
                    href={p.published_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-success-bg bg-success-bg px-3 py-2 text-xs font-medium text-success transition hover:opacity-90"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Konten
                  </a>
                ) : (
                  <button
                    onClick={() => setEditLink(p)}
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-warn transition hover:bg-warn-bg"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    Tambah Link
                  </button>
                )}

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
                    onClick={() => setEditLink(p)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-xs font-medium text-primary transition hover:bg-primary-light"
                  >
                    <LinkIcon className="h-3 w-3" />
                    Edit Link
                  </button>
                </div>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-danger-bg py-2 text-xs font-medium text-danger transition hover:bg-danger-bg"
                >
                  <Trash2 className="h-3 w-3" />
                  Hapus
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Detail */}
      {detail && (
        <ContentDetailModal item={detail} onClose={() => setDetail(null)} />
      )}

      {/* Modal Edit Link */}
      {editLink && (
        <EditLinkModal
          item={editLink}
          onClose={() => setEditLink(null)}
          onSave={handleSaveLink}
          loading={updateMut.isPending}
        />
      )}

      {/* Toast */}
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
// Edit Link Modal
// ─────────────────────────────────────────────────────────
function EditLinkModal({
  item,
  onClose,
  onSave,
  loading,
}: {
  item: ContentItem;
  onClose: () => void;
  onSave: (url: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState(item.published_url ?? "");
  const brand = BRANDS.find((b) => b.id === item.brand_id);

  return (
    <Modal open onClose={loading ? () => {} : onClose} title="Link Publikasi">
      <div className="flex flex-col gap-4 text-sm">
        <div className="rounded-xl border border-line p-4">
          <div className="mb-2 text-xs font-medium text-sub">Konten:</div>
          <div className="flex items-center gap-2">
            <BrandDot id={item.brand_id} />
            <span className="font-semibold">{item.title}</span>
          </div>
          <div className="mt-1 text-xs text-sub">
            {brand?.name} · {item.platform}
          </div>
        </div>

        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">URL Konten Live</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://instagram.com/p/... atau https://www.tiktok.com/@..."
            disabled={loading}
            className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
          <span className="mt-1 text-[10px] text-sub">
            Kosongkan untuk hapus link.
          </span>
        </label>

        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={() => onSave(url.trim())}
            disabled={loading}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Menyimpan…" : "Simpan"}
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
