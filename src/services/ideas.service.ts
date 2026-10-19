import { supabase } from "./supabase/client";
import type { ContentIdea, ContentIdeaInput } from "@/types/content";

export const ideasService = {
  /** List semua ide, urut dari terbaru */
  async list(brand_id?: string): Promise<ContentIdea[]> {
    let q = supabase
      .from("content_ideas")
      .select("*")
      .order("created_at", { ascending: false });

    if (brand_id) q = q.eq("brand_id", brand_id);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as ContentIdea[];
  },

  /** Buat ide baru */
  async create(input: ContentIdeaInput): Promise<ContentIdea> {
    // 🎯 Ambil email user yang login
    const { data: authData } = await supabase.auth.getUser();
    const userEmail = authData?.user?.email ?? null;

    const payload = {
      ...input,
      created_by_name: userEmail,
    };

    const { data, error } = await supabase
      .from("content_ideas")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as ContentIdea;
  },

  /** Update ide */
  async update(
    id: string,
    patch: Partial<ContentIdeaInput>,
  ): Promise<ContentIdea> {
    const { data, error } = await supabase
      .from("content_ideas")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ContentIdea;
  },

  /** Hapus ide */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("content_ideas")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  /**
   * Kirim ide ke Perencanaan 30 Hari.
   * Insert ke content_items dengan workflow_stage='planning',
   * lalu hapus dari content_ideas.
   */
  async sendToPlanning(
    idea: ContentIdea,
    plannedDate: string | null = null,
  ): Promise<void> {
    // 1. Insert ke content_items
    const { error: insertErr } = await supabase.from("content_items").insert({
      brand_id: idea.brand_id,
      title: idea.title,
      hook: idea.hook,
      concept: idea.concept,
      caption: idea.caption,
      cta: idea.cta,
      visual_notes: idea.visual_notes,
      audience: idea.audience,
      hashtags: idea.hashtags ?? [],
      content_pillar: idea.content_pillar,
      platform: idea.platform ?? "Instagram",
      format: idea.format,
      objective: idea.objective,
      style: idea.style,
      production_status: "Direncanakan",
      workflow_stage: "planning",
      planned_date: plannedDate,
      duration_seconds: idea.duration_seconds,
      reason: idea.reason,
      created_by_name: idea.created_by_name,
    });
    if (insertErr) throw insertErr;

    // 2. Hapus dari content_ideas
    const { error: delErr } = await supabase
      .from("content_ideas")
      .delete()
      .eq("id", idea.id);
    if (delErr) throw delErr;
  },
};
