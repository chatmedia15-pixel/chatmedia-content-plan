import { supabase } from "./supabase/client";
import type {
  ContentItem,
  ContentIdea,
  BrandRow,
  SocialSnapshot,
} from "@/types/content";

export interface BackupData {
  metadata: {
    exportedAt: string;
    version: string;
    appName: string;
  };
  brands: BrandRow[];
  content_items: ContentItem[];
  content_ideas: ContentIdea[];
  social_account_snapshots: SocialSnapshot[];
  stats: {
    totalContent: number;
    totalIdeas: number;
    totalBrands: number;
    totalSnapshots: number;
  };
}

export const backupService = {
  /**
   * Export semua data aplikasi ke JSON.
   */
  async exportAll(): Promise<BackupData> {
    const [brandsRes, contentRes, ideasRes, snapshotsRes] = await Promise.all([
      supabase.from("brands").select("*").order("name"),
      supabase.from("content_items").select("*").order("created_at"),
      supabase.from("content_ideas").select("*").order("created_at"),
      supabase.from("social_account_snapshots").select("*").order("synced_at"),
    ]);

    if (brandsRes.error) throw brandsRes.error;
    if (contentRes.error) throw contentRes.error;
    if (ideasRes.error) throw ideasRes.error;
    if (snapshotsRes.error) throw snapshotsRes.error;

    const brands = (brandsRes.data ?? []) as BrandRow[];
    const contentItems = (contentRes.data ?? []) as ContentItem[];
    const ideas = (ideasRes.data ?? []) as ContentIdea[];
    const snapshots = (snapshotsRes.data ?? []) as SocialSnapshot[];

    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        appName: "Content Plan Chatmedia",
      },
      brands,
      content_items: contentItems,
      content_ideas: ideas,
      social_account_snapshots: snapshots,
      stats: {
        totalContent: contentItems.length,
        totalIdeas: ideas.length,
        totalBrands: brands.length,
        totalSnapshots: snapshots.length,
      },
    };
  },

  /**
   * Trigger download file JSON backup.
   */
  downloadJSON(data: BackupData) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `chatmedia-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Trigger download file CSV untuk content_items.
   */
  downloadContentCSV(items: ContentItem[], brands: BrandRow[]) {
    const brandMap = Object.fromEntries(brands.map((b) => [b.id, b.name]));

    const headers = [
      "Tanggal Rencana",
      "Tanggal Publish",
      "Judul",
      "Brand",
      "Platform",
      "Format",
      "Pillar",
      "Objective",
      "Status Produksi",
      "Stage",
      "URL Publikasi",
      "Hook",
      "Caption",
      "CTA",
    ];

    const rows = items.map((it) => {
      const escape = (s: string | null | undefined) => {
        if (!s) return "";
        const str = String(s).replace(/"/g, '""');
        return `"${str}"`;
      };
      return [
        escape(it.planned_date),
        escape(it.published_at?.slice(0, 10)),
        escape(it.title),
        escape(brandMap[it.brand_id] ?? it.brand_id),
        escape(it.platform),
        escape(it.format),
        escape(it.content_pillar),
        escape(it.objective),
        escape(it.production_status),
        escape(it.workflow_stage),
        escape(it.published_url),
        escape(it.hook),
        escape(it.caption),
        escape(it.cta),
      ].join(",");
    });

    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    // \uFEFF = BOM biar Excel baca UTF-8 dengan benar

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `chatmedia-content-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
