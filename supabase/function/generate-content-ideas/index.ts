// Supabase Edge Function: generate-content-ideas
// Generate 3 ide konten via Nexotao API (OpenAI-compatible gateway)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const InputSchema = z.object({
  brand: z.string().min(1),
  category: z.string().min(1),
  platform: z.enum(["Instagram", "TikTok"]),
  format: z.string().min(1),
  objective: z.enum(["Jangkauan", "Interaksi", "Konversi"]),
  style: z.string().min(1),
});

const IdeaSchema = z.object({
  title: z.string(),
  hook: z.string(),
  pillar: z.string(),
  concept: z.string(),
  cta: z.string(),
  caption: z.string(),
  audience: z.string(),
});
const OutputSchema = z.array(IdeaSchema).length(3);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const input = InputSchema.parse(body);

    // ── Config dari secret ─────────────────────────────
    const apiKey = Deno.env.get("NEXOTAO_API_KEY");
    const baseUrl =
      Deno.env.get("NEXOTAO_BASE_URL") ?? "https://api.nexotao.com/v1";
    const model = Deno.env.get("NEXOTAO_MODEL") ?? "gpt-5-mini";

    if (!apiKey) throw new Error("NEXOTAO_API_KEY belum di-set");

    // ── Prompt ─────────────────────────────────────────
    const prompt = `Kamu adalah content strategist untuk brand "${input.brand}" (kategori: ${input.category}).

Buat 3 ide konten ${input.platform} dengan format ${input.format}.
Tujuan: ${input.objective}
Gaya: ${input.style}

Balas HANYA dalam format JSON array dengan tepat 3 objek. Setiap objek punya field:
- title: judul konten (maks 60 karakter)
- hook: kalimat pembuka menarik (maks 90 karakter)
- pillar: pilar konten yang sesuai
- concept: konsep/isi konten (2-3 kalimat)
- cta: call to action
- caption: caption siap pakai untuk ${input.platform} (maks 400 karakter, boleh ada hashtag)
- audience: target audiens

Bahasa Indonesia. Jangan tambahkan penjelasan di luar JSON.`;

    // ── Panggil Nexotao ───────────────────────────────
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Kamu adalah content strategist yang selalu membalas dengan JSON valid tanpa markdown code fence.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Nexotao error ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const rawText: string = data?.choices?.[0]?.message?.content ?? "";

    if (!rawText) throw new Error("Nexotao tidak mengembalikan teks");

    // ── Parse JSON ────────────────────────────────────
    let parsed: unknown;
    try {
      const clean = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const start = clean.indexOf("[");
      const end = clean.lastIndexOf("]");
      const jsonStr =
        start >= 0 && end > start ? clean.substring(start, end + 1) : clean;
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      throw new Error(`Gagal parse JSON: ${(e as Error).message}`);
    }

    // ── Validasi output ───────────────────────────────
    const ideas = OutputSchema.parse(parsed);

    return new Response(JSON.stringify({ success: true, data: ideas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[generate-content-ideas]", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
