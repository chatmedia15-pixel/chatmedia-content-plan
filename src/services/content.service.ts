import { supabase } from "./supabase/client";
import type { ContentItem, ContentItemInput } from "@/types/content";
import type { WorkflowStage } from "@/lib/constants";

// ── Helper: Format error Supabase ─────────────
function fmtError(error: unknown): Error {
  if (error && typeof error === "object") {
    const e = error as {
      code?: string;
      message?: string;
      details?: string;
      hint?: string;
    };
    const parts = [e.code, e.message, e.details, e.hint].filter(Boolean);
    return new Error(parts.join(" | ") || "Unknown Supabase error");
  }
  return new Error(String(error));
}

export const contentService = {
  /** Ambil semua content_items, optional filter */
  async list(filters?: {
    brand_id?: string;
    workflow_stage?: WorkflowStage;
  }): Promise<ContentItem[]> {
    let query = supabase
      .from("content_items")
      .select("*")
      .is("archived_at", null)
      .order("planned_date", { ascending: true, nullsFirst: false });

    if (filters?.brand_id) {
      query = query.eq("brand_id", filters.brand_id);
    }
    if (filters?.workflow_stage) {
      query = query.eq("workflow_stage", filters.workflow_stage);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ContentItem[];
  },

  /** Ambil 1 item by ID */
  async getById(id: string): Promise<ContentItem | null> {
    const { data, error } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as ContentItem) ?? null;
  },

  /** Buat item baru */
  async create(input: ContentItemInput): Promise<ContentItem> {
    // Ambil email dari session yang login
    const { data: authData } = await supabase.auth.getUser();
    const userEmail = authData?.user?.email ?? null;

    const payload = {
      ...input,
      created_by_name: userEmail,
    };

    console.log("[content.create] payload:", payload);
    const { data, error } = await supabase
      .from("content_items")
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error("[content.create] error:", error);
      throw fmtError(error);
    }
    return data as ContentItem;
  },

  /** Update item */
  async update(
    id: string,
    patch: Partial<ContentItemInput>,
  ): Promise<ContentItem> {
    const { data, error } = await supabase
      .from("content_items")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as ContentItem;
  },

  /** Hapus permanen */
  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from("content_items")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  /** Arsipkan (soft delete) */
  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from("content_items")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  },

  /**
   * Pindah workflow stage (planning → calendar → published)
   * pakai RPC atomik supaya tidak duplikat.
   */
  async moveStage(
    id: string,
    newStage: WorkflowStage,
    publishedUrl?: string,
  ): Promise<ContentItem> {
    const { data, error } = await supabase.rpc("move_content_stage", {
      p_id: id,
      p_new_stage: newStage,
      p_published_url: publishedUrl ?? null,
    });
    if (error) {
      console.error("[content.moveStage] RPC error:", error);
      throw fmtError(error);
    }

    // 🎯 Kirim notifikasi WA kalau publish
    if (newStage === "published") {
      console.log("[WA] Memanggil notify-publish untuk contentId:", id);

      supabase.functions
        .invoke("notify-publish", { body: { contentId: id } })
        .then((res) => {
          console.log("[WA] Response:", res.data);
          if (res.error) {
            console.error("[WA] Error:", res.error);
          }
        })
        .catch((err) => console.error("[WA] Exception:", err));
    }

    return data as ContentItem;
  },
};
