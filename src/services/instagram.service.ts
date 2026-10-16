import { supabase } from "./supabase/client";
import type { SocialSnapshot } from "@/types/content";

export interface InstagramDataByBrand {
  [brandId: string]: SocialSnapshot;
}

export const instagramService = {
  /**
   * Baca snapshot terbaru per brand dari Supabase.
   * Return: { data: { [brandId]: snapshot }, syncedAt: timestamp }
   */
  async getLatestSnapshots(): Promise<{
    data: InstagramDataByBrand | null;
    syncedAt: string | null;
  }> {
    const { data, error } = await supabase
      .from("social_account_snapshots")
      .select("*")
      .order("synced_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return { data: null, syncedAt: null };

    const byBrand: InstagramDataByBrand = {};
    for (const row of data as SocialSnapshot[]) {
      if (!byBrand[row.brand_id]) byBrand[row.brand_id] = row;
    }
    return { data: byBrand, syncedAt: data[0].synced_at };
  },

  /**
   * Trigger sync via Edge Function (proxy ke GAS CreatorCrawl).
   * Akan tersedia setelah Langkah 8.
   */
  async sync(brands: string[]): Promise<{
    data: InstagramDataByBrand | null;
    syncedAt: string | null;
  }> {
    const { data, error } = await supabase.functions.invoke("sync-instagram", {
      body: { brands },
    });
    if (error) throw error;
    if (!data?.success) {
      throw new Error(data?.error ?? "Sync gagal");
    }
    return { data: data.data, syncedAt: data.syncedAt };
  },
};
