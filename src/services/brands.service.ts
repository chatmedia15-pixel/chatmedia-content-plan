import { supabase } from "./supabase/client";
import type { BrandRow } from "@/types/content";

export const brandsService = {
  async list(): Promise<BrandRow[]> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) throw error;
    return (data ?? []) as BrandRow[];
  },

  async getBySlug(slug: string): Promise<BrandRow | null> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as BrandRow) ?? null;
  },
};
