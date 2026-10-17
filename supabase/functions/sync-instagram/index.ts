import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Map brand slug → Instagram handle
const BRAND_HANDLES: Record<string, string> = {
  chatbarber: "chatbarber_",
  shoetreatment: "chatshoetreatment",
  chatbox: "chatbox.id",
  konveksi: "chttnbasic",
};

interface CreatorCrawlPost {
  id: string;
  url: string;
  type: string;
  created_at: string;
  text: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
  hashtags?: string[];
  duration_seconds?: number;
  is_sponsored?: boolean;
  media?: Array<{ thumbnail_url?: string }>;
}

interface CreatorCrawlProfile {
  id: string;
  handle: string;
  name: string;
  bio: string;
  url: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  verified: boolean;
  recent_posts?: CreatorCrawlPost[];
}

interface NormalizedBrandData {
  success: boolean;
  username: string;
  fullName: string;
  followers: number;
  posts: number;
  totalLikes: number;
  totalViews: number;
  avgLikes: number;
  avgViews: number;
  avatar: string;
  url: string;
  verified: boolean;
  recentPosts: Array<{
    url?: string;
    caption?: string;
    likes?: number;
    views?: number;
    type?: "reel" | "post";
  }>;
  error?: string;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Ambil secret ─────────────────────────────
    const creatorCrawlKey = Deno.env.get("CREATORCRAWL_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!creatorCrawlKey) throw new Error("CREATORCRAWL_API_KEY belum di-set");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase env vars tidak lengkap");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Fetch data per brand ─────────────────────
    const results: Record<string, NormalizedBrandData> = {};
    const brandSlugs = Object.keys(BRAND_HANDLES);

    for (const slug of brandSlugs) {
      const handle = BRAND_HANDLES[slug];
      try {
        const data = await fetchBrandFromCreatorCrawl(handle, creatorCrawlKey);
        results[slug] = data;
      } catch (err) {
        results[slug] = {
          success: false,
          username: handle,
          fullName: "",
          followers: 0,
          posts: 0,
          totalLikes: 0,
          totalViews: 0,
          avgLikes: 0,
          avgViews: 0,
          avatar: "",
          url: "",
          verified: false,
          recentPosts: [],
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }

      // Jeda antar request (CreatorCrawl rate limit)
      if (slug !== brandSlugs[brandSlugs.length - 1]) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // ── Resolve brand_id dari slug ───────────────
    const { data: brandRows, error: brandErr } = await supabase
      .from("brands")
      .select("id, slug");

    if (brandErr) throw brandErr;
    const slugToId: Record<string, string> = {};
    for (const b of brandRows ?? []) {
      slugToId[b.slug] = b.id;
    }

    // ── Insert snapshots ─────────────────────────
    const now = new Date().toISOString();
    const snapshots = [];

    for (const slug of brandSlugs) {
      const data = results[slug];
      const brandId = slugToId[slug];
      if (!brandId) continue;

      snapshots.push({
        brand_id: brandId,
        platform: "Instagram",
        username: data.username,
        profile_url: data.url,
        avatar_url: data.avatar,
        is_verified: data.verified,
        followers: data.followers,
        posts_count: data.posts,
        total_likes: data.totalLikes,
        total_views: data.totalViews,
        avg_likes: data.avgLikes,
        avg_views: data.avgViews,
        recent_posts: data.recentPosts,
        source: "CreatorCrawl",
        sync_status: data.success ? "success" : "failed",
        sync_message: data.error ?? null,
        synced_at: now,
      });
    }

    if (snapshots.length === 0) {
      throw new Error("Tidak ada brand yang cocok dengan slug");
    }

    const { error: insertErr } = await supabase
      .from("social_account_snapshots")
      .insert(snapshots);

    if (insertErr) throw insertErr;

    // ── Log sync ─────────────────────────────────
    const successCount = Object.values(results).filter((r) => r.success).length;
    const failCount = brandSlugs.length - successCount;

    await supabase.from("integration_sync_logs").insert({
      integration_key: "instagram",
      status: successCount === brandSlugs.length ? "success" : "partial",
      finished_at: now,
      records_processed: snapshots.length,
      message: `${successCount}/${brandSlugs.length} berhasil`,
      metadata: {
        success_brands: Object.entries(results)
          .filter(([, v]) => v.success)
          .map(([k]) => k),
        failed_brands: Object.entries(results)
          .filter(([, v]) => !v.success)
          .map(([k, v]) => ({ slug: k, error: v.error })),
        fail_count: failCount,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        syncedAt: now,
        brands: snapshots.length,
        errors:
          failCount > 0
            ? Object.entries(results)
                .filter(([, v]) => !v.success)
                .map(([k, v]) => `${k}: ${v.error}`)
            : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-instagram]", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Fetch 1 brand dari CreatorCrawl & normalisasi.
 */
async function fetchBrandFromCreatorCrawl(
  handle: string,
  apiKey: string,
): Promise<NormalizedBrandData> {
  const url = `https://app.creatorcrawl.com/api/instagram/profile?handle=${encodeURIComponent(handle)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "x-api-key": apiKey },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`CreatorCrawl ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  if (!json.data) throw new Error("CreatorCrawl tidak mengembalikan data");

  const d = json.data as CreatorCrawlProfile;
  const posts = d.recent_posts ?? [];

  // Hitung agregat
  let totalLikes = 0;
  let totalViews = 0;
  for (const p of posts) {
    totalLikes += p.like_count ?? 0;
    totalViews += p.view_count ?? 0;
  }
  const avgLikes = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0;
  const avgViews = posts.length > 0 ? Math.round(totalViews / posts.length) : 0;

  // Normalisasi recentPosts (max 10)
  const recentPosts = posts.slice(0, 10).map((p) => ({
    url: p.url,
    caption: (p.text ?? "").substring(0, 150),
    likes: p.like_count ?? 0,
    views: p.view_count ?? 0,
    type: (p.type === "reel" ? "reel" : "post") as "reel" | "post",
  }));

  return {
    success: true,
    username: d.handle,
    fullName: d.name,
    followers: d.follower_count ?? 0,
    posts: d.post_count ?? 0,
    totalLikes,
    totalViews,
    avgLikes,
    avgViews,
    avatar: d.avatar_url,
    url: d.url,
    verified: d.verified ?? false,
    recentPosts,
  };
}
