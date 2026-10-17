import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppMessage } from "../_shared/whatsapp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { contentId } = await req.json();
    if (!contentId) throw new Error("contentId wajib");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: item, error } = await supabase
      .from("content_items")
      .select("*, brands(name)")
      .eq("id", contentId)
      .single();

    if (error || !item) throw new Error("Konten tidak ditemukan");

    const dateStr = item.planned_date
      ? new Date(item.planned_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

    const separator = "━━━━━━━━━━━━━━━━━━━━";
    const lines = [
      "🎉 *KONTEN BARU DIPUBLIKASI!*",
      `📅 *${dateStr}*`,
      separator,
      "",
      `🏷️ Brand    : ${item.brands?.name || "-"}`,
      `📱 Platform : ${item.platform || "-"}`,
      `🎬 Format   : ${item.format || "-"}`,
      `🎣 Judul    : ${item.title || "-"}`,
      `👥 Talent   : ${item.talent_count ?? 0} orang`,
    ];

    if (item.published_url) {
      lines.push("", "🔗 *Link Konten:*", `👉 ${item.published_url}`, "");
    }

    lines.push(separator, "Konten sudah diupload! Semangat promosinya 🚀");

    const result = await sendWhatsAppMessage(lines.join("\n"));

    return new Response(JSON.stringify({ success: true, wa: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
