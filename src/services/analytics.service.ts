import { supabase } from "./supabase/client";
import type { ContentItem } from "@/types/content";

export interface ContentCountsBySource {
  planning: number;
  calendar: number;
  published: number;
  total: number;
}

export const analyticsService = {
  /** Hitung jumlah konten per workflow stage */
  async getContentCounts(): Promise<ContentCountsBySource> {
    const { data, error } = await supabase
      .from("content_items")
      .select("workflow_stage")
      .is("archived_at", null);
    if (error) throw error;

    const rows = (data ?? []) as { workflow_stage: string }[];
    const counts = {
      planning: 0,
      calendar: 0,
      published: 0,
      total: rows.length,
    };
    for (const r of rows) {
      if (r.workflow_stage === "planning") counts.planning++;
      else if (r.workflow_stage === "calendar") counts.calendar++;
      else if (r.workflow_stage === "published") counts.published++;
    }
    return counts;
  },

  /** Distribusi konten per brand */
  async getByBrand(): Promise<{ brand_id: string; count: number }[]> {
    const { data, error } = await supabase
      .from("content_items")
      .select("brand_id")
      .is("archived_at", null);
    if (error) throw error;

    const map: Record<string, number> = {};
    for (const r of (data ?? []) as { brand_id: string }[]) {
      map[r.brand_id] = (map[r.brand_id] ?? 0) + 1;
    }
    return Object.entries(map).map(([brand_id, count]) => ({
      brand_id,
      count,
    }));
  },

  /** Ambil content_items untuk halaman tertentu */
  async listContent(filters?: {
    brand_id?: string;
    workflow_stage?: string;
  }): Promise<ContentItem[]> {
    let q = supabase
      .from("content_items")
      .select("*")
      .is("archived_at", null)
      .order("planned_date", { ascending: false, nullsFirst: false });

    if (filters?.brand_id) q = q.eq("brand_id", filters.brand_id);
    if (filters?.workflow_stage)
      q = q.eq("workflow_stage", filters.workflow_stage);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as ContentItem[];
  },
};
