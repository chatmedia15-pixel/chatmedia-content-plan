import { Modal, Pill, BrandDot, PlatformIcon } from "@/components/ui";
import { Link as LinkIcon, ExternalLink, X } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { BRANDS } from "@/lib/constants";
import type { ContentItem } from "@/types/content";

interface ContentDetailModalProps {
  item: ContentItem | null;
  onClose: () => void;
}

export function ContentDetailModal({ item, onClose }: ContentDetailModalProps) {
  if (!item) return null;

  const brand = BRANDS.find((b) => b.id === item.brand_id);

  return (
    <Modal open onClose={onClose} title="Detail Konten" wide>
      <div className="flex flex-col gap-4 text-sm">
        {/* Header */}
        <div className="rounded-xl border border-line bg-slate-50/60 p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-sub">
              <BrandDot id={item.brand_id} />
              {brand?.name ?? item.brand_id}
            </span>
            {item.platform && (
              <Pill tone="blue">
                <PlatformIcon platform={item.platform} className="h-3 w-3" />
                {item.platform}
              </Pill>
            )}
            {item.format && <Pill tone="purple">{item.format}</Pill>}
            {item.production_status && (
              <Pill tone="warn">{item.production_status}</Pill>
            )}
          </div>
          <div className="text-base font-semibold text-ink">
            {item.title || "(tanpa judul)"}
          </div>
          {item.planned_date && (
            <div className="mt-1 text-xs text-sub">
              Tanggal: {fmtDate(item.planned_date)}
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label="Brand" value={brand?.name ?? item.brand_id} />
          <InfoRow label="Tanggal Publish" value={fmtDate(item.planned_date)} />
          <InfoRow
            label="Tanggal Take"
            value={item.shoot_date ? fmtDate(item.shoot_date) : "-"}
          />
          <InfoRow label="Platform" value={item.platform} />
          <InfoRow label="Format" value={item.format ?? "-"} />
          <InfoRow label="Pillar" value={item.content_pillar ?? "-"} />
          <InfoRow label="Objective" value={item.objective ?? "-"} />
          <InfoRow
            label="Jumlah Talent"
            value={`${item.talent_count ?? 0} orang`}
          />
          <InfoRow label="Dibuat Oleh" value={item.created_by_name ?? "-"} />
          <InfoRow label="Dibuat Pada" value={fmtDate(item.created_at)} />
        </div>

        {/* Sections */}
        {item.hook && <Block label="Hook" value={item.hook} italic />}
        {item.concept && <Block label="Konsep" value={item.concept} />}
        {item.caption && <Block label="Caption" value={item.caption} />}
        {item.cta && <Block label="CTA" value={item.cta} />}

        {item.link_ref && (
          <div className="rounded-xl border border-line bg-primary-light p-3">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-primary">
              Link Referensi
            </div>
            <a
              href={item.link_ref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 break-all text-sm font-medium text-primary hover:underline"
            >
              <LinkIcon className="h-3.5 w-3.5 shrink-0" />
              {item.link_ref}
            </a>
          </div>
        )}

        {item.published_url && (
          <div className="rounded-xl border border-success-bg bg-success-bg p-3">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-success">
              Link Live
            </div>
            <a
              href={item.published_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 break-all text-sm font-medium text-success hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {item.published_url}
            </a>
          </div>
        )}

        {item.visual_notes && (
          <Block label="Visual / Konsep" value={item.visual_notes} />
        )}

        {item.reason && <Block label="Alasan / Catatan" value={item.reason} />}

        {/* Footer */}
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <button
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-sub transition hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-sub">
        {label}
      </div>
      <div className="break-words text-sm font-medium text-ink">
        {value ?? "-"}
      </div>
    </div>
  );
}

function Block({
  label,
  value,
  italic,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line p-3">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-sub">
        {label}
      </div>
      <div
        className={`whitespace-pre-wrap break-words text-sm text-ink ${italic ? "italic" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
