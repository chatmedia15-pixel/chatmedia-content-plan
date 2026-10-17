import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendWhatsAppMessage } from "../_shared/whatsapp.ts";

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date().toISOString().slice(0, 10);

    const { data: items, error } = await supabase
      .from("content_items")
      .select("*, brands(name)")
      .eq("planned_date", today);

    if (error) throw error;

    const dateStr = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const separator = "━━━━━━━━━━━━━━━━━━━━";
    let message = "";

    if (!items || items.length === 0) {
      message = `📋 *LAPORAN KONTEN HARIAN*\n${dateStr}\n${separator}\n\nTidak ada konten yang dijadwalkan hari ini.`;
    } else {
      const lines = [
        "📋 *LAPORAN KONTEN HARIAN*",
        dateStr,
        `Total: *${items.length}* konten`,
        separator,
        "",
      ];

      items.forEach((item, idx) => {
        lines.push(`*${idx + 1}. ${item.title || "(tanpa judul)"}*`, "");
        lines.push(`*Brand:* ${item.brands?.name || "-"}`);
        lines.push(`*Platform:* ${item.platform || "-"}`);
        lines.push(`*Talent:* ${item.talent_count ?? 0} orang`);
        if (item.production_status)
          lines.push(`*Status:* ${item.production_status}`);
        lines.push("", "");
      });

      lines.push(separator);
      lines.push("_Dikirim otomatis oleh Content Plan Chatmedia_");
      message = lines.join("\n");
    }

    await sendWhatsAppMessage(message);

    return new Response(
      JSON.stringify({ success: true, count: items?.length || 0 }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
