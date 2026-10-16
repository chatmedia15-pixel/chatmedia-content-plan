import {
  Sparkles,
  Camera as Instagram,
  Database,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, Pill, BrandDot, SectionHeader } from "@/components/ui";
import { BRANDS } from "@/lib/constants";
import { supabase } from "@/services/supabase/client";
import { useSession } from "@/features/auth/useSession";

export function SettingsPage() {
  const { session } = useSession();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const hasSupabase = Boolean(supabase && supabaseUrl);

  return (
    <div className="flex animate-in flex-col gap-5 sm:gap-6">
      <SectionHeader
        title="Pengaturan"
        desc="Informasi koneksi, brand, dan preferensi aplikasi."
      />

      {/* Status koneksi */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Database className="h-4 w-4 text-primary" />
              Supabase
            </div>
            <Pill tone={hasSupabase ? "good" : "bad"}>
              {hasSupabase ? "Aktif" : "Error"}
            </Pill>
          </div>
          <p className="text-xs text-sub">
            {hasSupabase
              ? "Database & autentikasi terhubung."
              : "Konfigurasi belum lengkap."}
          </p>
          {supabaseUrl && (
            <div className="break-all rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] text-sub">
              {supabaseUrl}
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-ai" />
              Nexotao AI
            </div>
            <Pill tone="good">Aktif</Pill>
          </div>
          <p className="text-xs text-sub">
            Edge Functions untuk ide, caption, dan analisis.
          </p>
          <div className="flex flex-wrap gap-1">
            <Pill tone="purple">generate-content-ideas</Pill>
            <Pill tone="purple">generate-caption</Pill>
            <Pill tone="purple">analyze-insights</Pill>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Instagram className="h-4 w-4 text-[#E1306C]" />
              Instagram Sync
            </div>
            <Pill tone="warn">Manual</Pill>
          </div>
          <p className="text-xs text-sub">
            Sinkronisasi data Instagram via CreatorCrawl.
          </p>
          <p className="text-[10px] text-sub">
            * Belum otomatis — perlu edge function sync-instagram.
          </p>
        </Card>
      </div>

      {/* User info */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-sm font-semibold">Akun Anda</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Info label="Email" value={session?.user?.email ?? "-"} />
          <Info
            label="User ID"
            value={session?.user?.id ? session.user.id.slice(0, 12) + "…" : "-"}
          />
          <Info
            label="Login sejak"
            value={
              session?.user?.created_at
                ? new Date(session.user.created_at).toLocaleDateString("id-ID")
                : "-"
            }
          />
          <Info
            label="Terakhir update"
            value={
              session?.user?.updated_at
                ? new Date(session.user.updated_at).toLocaleString("id-ID")
                : "-"
            }
          />
        </div>
      </Card>

      {/* Brand list */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandDot id={BRANDS[0].id} />
            <span className="text-sm font-semibold">Brand Terdaftar</span>
          </div>
          <Pill tone="blue">{BRANDS.length} brand</Pill>
        </div>
        <div className="flex flex-col gap-2">
          {BRANDS.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{b.name}</div>
                  <div className="truncate text-[10px] text-sub">
                    {b.category}
                  </div>
                </div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[10px] text-sub">Slug</div>
                <code className="text-xs">{b.slug}</code>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-sub">
          * Untuk menambah brand baru, perlu update via SQL & code (fitur
          Pengaturan dinamis belum tersedia).
        </p>
      </Card>

      {/* Info versi */}
      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <XCircle className="h-4 w-4 text-sub" />
          <span className="text-sm font-semibold">Tentang Aplikasi</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Info label="Versi" value="0.1.0" />
          <Info label="Framework" value="React 19 + Vite" />
          <Info label="Styling" value="Tailwind CSS 4" />
          <Info label="Database" value="Supabase (Postgres)" />
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-sub">
        {label}
      </div>
      <div className="mt-0.5 break-all text-xs font-medium text-ink">
        {value}
      </div>
    </div>
  );
}
