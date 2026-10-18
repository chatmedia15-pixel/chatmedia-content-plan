import { supabase } from "./supabase/client";
import type { Platform, Objective } from "@/lib/constants";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export interface GenerateIdeasInput {
  brand: string;
  category: string;
  platform: Platform;
  format: string;
  objective: Objective;
  style: string;
}

export interface GeneratedIdea {
  title: string;
  hook: string;
  pillar: string;
  concept: string;
  cta: string;
  caption: string;
  audience: string;
}

export interface GenerateCaptionInput {
  brand: string;
  title: string;
  hook?: string;
  platform: string;
  pillar?: string;
  mode?: "caption" | "scoring" | "ab_test" | "concept";
  format?: string;
  objective?: string;
}

export interface AnalyzeInsightsInput {
  context: string;
}

// ─────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────
export const aiService = {
  /**
   * Generate 3 ide konten via Edge Function `generate-content-ideas`.
   */
  async generateContentIdeas(
    input: GenerateIdeasInput,
  ): Promise<GeneratedIdea[]> {
    const { data, error } = await supabase.functions.invoke(
      "generate-content-ideas",
      { body: input },
    );

    if (error) throw new Error(error.message ?? "Gagal memanggil AI");
    if (!data?.success) throw new Error(data?.error ?? "AI gagal generate ide");

    return data.data as GeneratedIdea[];
  },

  /**
   * Generate 1 caption via Edge Function `generate-caption`.
   */
  async generateCaption(input: GenerateCaptionInput): Promise<string> {
    const { data, error } = await supabase.functions.invoke(
      "generate-caption",
      { body: input },
    );

    if (error) throw new Error(error.message ?? "Gagal generate caption");
    if (!data?.success)
      throw new Error(data?.error ?? "AI gagal generate caption");

    // 🎯 Mode caption → data.caption, mode lain → data.text
    const result = data.data.caption ?? data.data.text;
    if (!result) throw new Error("Response AI kosong");
    return result;
  },

  /**
   * Analisis insight marketing via Edge Function `analyze-insights`.
   */
  async analyzeInsights(input: AnalyzeInsightsInput): Promise<string> {
    const { data, error } = await supabase.functions.invoke(
      "analyze-insights",
      { body: input },
    );

    if (error) throw new Error(error.message ?? "Gagal analisis");
    if (!data?.success) throw new Error(data?.error ?? "AI gagal analisis");

    return data.data.text as string;
  },
  async chatAssistant(input: {
    brand: string;
    message: string;
  }): Promise<string> {
    const { data, error } = await supabase.functions.invoke("chat-assistant", {
      body: input,
    });
    if (error) throw new Error(error.message ?? "Gagal chat");
    if (!data?.success) throw new Error(data?.error ?? "Chat gagal");
    return data.data.reply;
  },
};
