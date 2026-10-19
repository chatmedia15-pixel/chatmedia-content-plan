import { useMemo, useState } from "react";
import { Users, Plus, Trash2, Eye, ExternalLink, Search } from "lucide-react";
import {
  Card,
  Pill,
  BrandDot,
  Select,
  Modal,
  SectionHeader,
  ConfirmDialog,
} from "@/components/ui";
import { BRANDS } from "@/lib/constants";
import { isValidUrl } from "@/lib/format";
import { useToast } from "@/hooks/useToast";

// ─────────────────────────────────────────────────────────
// Tipe
// ─────────────────────────────────────────────────────────
interface Competitor {
  id: string;
  brand_id: string;
  name: string;
  platform: string;
  url: string;
  followers: number | null;
  notes: string;
  created_at: number;
}

// ─────────────────────────────────────────────────────────
// Local storage
// ─────────────────────────────────────────────────────────
const STORAGE_KEY = "chatmedia:competitors";

function loadCompetitors(): Competitor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Competitor[];
  } catch {
    return [];
  }
}

function saveCompetitors(items: Competitor[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────
// Komponen
// ─────────────────────────────────────────────────────────
export function CompetitorsPage() {
  const { push, toasts } = useToast();

  const [items, setItems] = useState<Competitor[]>(() => loadCompetitors());
  const [filterBrand, setFilterBrand] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<Competitor | null>(null);
  const [deleteItem, setDeleteItem] = useState<Competitor | null>(null);

  function persist(next: Competitor[]) {
    setItems(next);
    saveCompetitors(next);
  }

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filterBrand !== "all" && it.brand_id !== filterBrand) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return it.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [items, filterBrand, search]);

  function handleDelete(id: string) {
    persist(items.filter((it) => it.id !== id));
    push("Kompetitor dihapus");
  }

  function handleAdd(input: Omit<Competitor, "id" | "created_at">) {
    const newItem: Competitor = {
      ...input,
      id: crypto.randomUUID(),
      created_at: Date.now(),
    };
    persist([newItem, ...items]);
    push("Kompetitor ditambahkan");
    setShowAdd(false);
  }

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Kompetitor"
        desc="Catat & pantau kompetitor per brand (manual)."
        action={
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Tambah Kompetitor
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
              placeholder="Cari kompetitor..."
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
          <Pill tone="blue">{filtered.length} kompetitor</Pill>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-line" />
          <div className="text-sm font-semibold text-ink">
            Belum ada kompetitor
          </div>
          <p className="mt-1 text-xs text-sub">
            Klik "Tambah Kompetitor" untuk mencatat kompetitor pertama.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((it) => {
            const brand = BRANDS.find((b) => b.id === it.brand_id);
            return (
              <Card
                key={it.id}
                className="flex flex-col gap-3 p-4 transition hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-sub">
                    <BrandDot id={it.brand_id} />
                    {brand?.name ?? it.brand_id}
                  </span>
                  <Pill tone="neutral">{it.platform}</Pill>
                </div>

                <div className="text-sm font-semibold">{it.name}</div>

                {it.followers !== null && (
                  <div className="text-xs text-sub">
                    Followers: {it.followers.toLocaleString("id-ID")}
                  </div>
                )}

                {it.url && (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-primary transition hover:bg-primary-light"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Profil
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDetail(it)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-xs font-medium text-ai transition hover:bg-ai-bg"
                  >
                    <Eye className="h-3 w-3" />
                    Detail
                  </button>
                  <button
                    onClick={() => setDeleteItem(it)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-danger-bg py-2 text-xs font-medium text-danger transition hover:bg-danger-bg"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddCompetitorModal
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {detail && (
        <Modal open onClose={() => setDetail(null)} title={detail.name} wide>
          <div className="flex flex-col gap-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info
                label="Brand"
                value={
                  BRANDS.find((b) => b.id === detail.brand_id)?.name ??
                  detail.brand_id
                }
              />
              <Info label="Platform" value={detail.platform} />
              <Info
                label="Followers"
                value={
                  detail.followers !== null
                    ? detail.followers.toLocaleString("id-ID")
                    : "-"
                }
              />
              <Info
                label="Ditambahkan"
                value={new Date(detail.created_at).toLocaleDateString("id-ID")}
              />
            </div>
            {detail.url && (
              <div className="rounded-xl border border-line bg-primary-light p-3">
                <div className="mb-1 text-[10px] font-medium uppercase text-primary">
                  URL
                </div>
                <a
                  href={detail.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm font-medium text-primary hover:underline"
                >
                  {detail.url}
                </a>
              </div>
            )}
            {detail.notes && (
              <div className="rounded-xl border border-line p-3">
                <div className="mb-1 text-[10px] font-medium uppercase text-sub">
                  Catatan
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {detail.notes}
                </div>
              </div>
            )}
            <button
              onClick={() => setDetail(null)}
              className="mt-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-sub"
            >
              Tutup
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteItem}
        itemName={deleteItem?.name}
        message="Data kompetitor akan dihapus permanen."
        onCancel={() => setDeleteItem(null)}
        onConfirm={() => {
          if (deleteItem) handleDelete(deleteItem.id);
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
// Modal: Tambah Kompetitor
// ─────────────────────────────────────────────────────────
function AddCompetitorModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: {
    brand_id: string;
    name: string;
    platform: string;
    url: string;
    followers: number | null;
    notes: string;
  }) => void;
}) {
  const [brandId, setBrandId] = useState(BRANDS[0].id);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [url, setUrl] = useState("");
  const [followers, setFollowers] = useState("");
  const [notes, setNotes] = useState("");

  function submit() {
    if (!name.trim()) return;
    if (url && !isValidUrl(url)) {
      alert("URL tidak valid, harus dimulai http:// atau https://");
      return;
    }
    onSave({
      brand_id: brandId,
      name: name.trim(),
      platform,
      url: url.trim(),
      followers: followers ? Number(followers) : null,
      notes: notes.trim(),
    });
  }

  const inputCls =
    "rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <Modal open onClose={onClose} title="Tambah Kompetitor" wide>
      <div className="flex flex-col gap-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Brand"
            value={brandId}
            onChange={setBrandId}
            options={BRANDS.map((b) => ({ value: b.id, label: b.name }))}
          />
          <Select
            label="Platform"
            value={platform}
            onChange={setPlatform}
            options={["Instagram", "TikTok", "YouTube", "Facebook", "Lainnya"]}
          />
        </div>

        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Nama Kompetitor *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Barber King Jakarta"
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">URL Profil</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://instagram.com/..."
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Jumlah Followers</span>
          <input
            type="number"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            placeholder="5000"
            className={inputCls}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sub">
          <span className="font-medium">Catatan</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Kelebihan, gaya konten, dll"
            className={inputCls}
          />
        </label>

        <div className="flex gap-2 border-t border-line pt-4">
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            Tambah
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
