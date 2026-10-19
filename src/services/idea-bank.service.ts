import { supabase } from "./supabase/client";
import type { ContentIdea } from "@/types/content";

export interface BankIdea {
  id: string;
  brand_id: string;
  title: string;
  hook: string | null;
  concept: string | null;
  caption: string | null;
  cta: string | null;
  audience: string | null;
  content_pillar: string | null;
  platform: string | null;
  format: string | null;
  objective: string | null;
  style: string | null;
  visual_notes: string | null;
  flow: string[];
  hashtags: string[];
  duration_seconds: number | null;
  source: string;
  reason: string | null;
  tags: string[];
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export const ideaBankService = {
  /** List semua ide di bank */
  async list(brand_id?: string): Promise<BankIdea[]> {
    let q = supabase
      .from("idea_bank")
      .select("*")
      .order("created_at", { ascending: false });

    if (brand_id) q = q.eq("brand_id", brand_id);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as BankIdea[];
  },

  /** Simpan ide dari draft ke bank */
  async saveToBank(idea: Partial<ContentIdea> | BankIdea): Promise<BankIdea> {
    const { data: authData } = await supabase.auth.getUser();
    const userEmail = authData?.user?.email ?? null;
    const payload = {
      brand_id: idea.brand_id!,
      title: idea.title!,
      hook: idea.hook ?? null,
      concept: idea.concept ?? null,
      caption: idea.caption ?? null,
      cta: idea.cta ?? null,
      audience: idea.audience ?? null,
      content_pillar: idea.content_pillar ?? null,
      platform: idea.platform ?? null,
      format: idea.format ?? null,
      objective: idea.objective ?? null,
      style: idea.style ?? null,
      visual_notes: idea.visual_notes ?? null,
      flow: idea.flow ?? [],
      hashtags: idea.hashtags ?? [],
      duration_seconds: idea.duration_seconds ?? null,
      source: idea.source ?? "manual",
      reason: idea.reason ?? null,
      created_by_name: userEmail,
      tags: [],
    };

    const { data, error } = await supabase
      .from("idea_bank")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as BankIdea;
  },

  /** Hapus dari bank */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("idea_bank").delete().eq("id", id);
    if (error) throw error;
  },

  /** Update bank idea (ubah tags, dsb) */
  async update(id: string, patch: Partial<BankIdea>): Promise<BankIdea> {
    const { data, error } = await supabase
      .from("idea_bank")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as BankIdea;
  },

  /**
   * Ambil ide dari bank, kirim ke Perencanaan 30 Hari.
   * Tidak menghapus dari bank — supaya bisa dipakai ulang.
   */
  /**
   * Kirim ide dari bank ke Perencanaan 30 Hari.
   * Setelah berhasil, ide DIHAPUS dari bank (pindah, bukan copy).
   */
  async sendToPlanningFromBank(
    bankIdea: BankIdea,
    plannedDate: string,
  ): Promise<void> {
    // 1. Insert ke content_items
    const { error: insertErr } = await supabase.from("content_items").insert({
      brand_id: bankIdea.brand_id,
      title: bankIdea.title,
      hook: bankIdea.hook,
      concept: bankIdea.concept,
      caption: bankIdea.caption,
      cta: bankIdea.cta,
      visual_notes: bankIdea.visual_notes,
      audience: bankIdea.audience,
      hashtags: bankIdea.hashtags ?? [],
      content_pillar: bankIdea.content_pillar,
      platform: bankIdea.platform ?? "Instagram",
      format: bankIdea.format,
      objective: bankIdea.objective,
      style: bankIdea.style,
      production_status: "Direncanakan",
      workflow_stage: "planning",
      planned_date: plannedDate,
      duration_seconds: bankIdea.duration_seconds,
      reason: bankIdea.reason,
      created_by_name: bankIdea.created_by_name,
    });
    if (insertErr) throw insertErr;

    // 2. Hapus dari bank (pindah, bukan copy)
    const { error: delErr } = await supabase
      .from("idea_bank")
      .delete()
      .eq("id", bankIdea.id);
    if (delErr) throw delErr;
  },
};
