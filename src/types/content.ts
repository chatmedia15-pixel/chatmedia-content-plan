import type {
  BrandId,
  Platform,
  ProductionStatus,
  WorkflowStage,
} from "@/lib/constants";

/** Row dari tabel `content_items` di Supabase */
export interface ContentItem {
  id: string;
  brand_id: BrandId | string;
  title: string;
  hook: string | null;
  concept: string | null;
  caption: string | null;
  cta: string | null;
  visual_notes: string | null;
  audience: string | null;
  hashtags: string[];
  content_pillar: string | null;
  platform: Platform;
  format: string | null;
  objective: string | null;
  talent_count: number | null;
  style: string | null;
  production_status: ProductionStatus | string;
  workflow_stage: WorkflowStage;
  planned_date: string | null;
  shoot_date: string | null;
  published_at: string | null;
  link_ref: string | null;
  published_url: string | null;
  duration_seconds: number | null;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

/** Row dari tabel `content_ideas` */
export interface ContentIdea {
  id: string;
  brand_id: BrandId | string;
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
  source: "manual" | "template" | "AI";
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

/** Row dari tabel `brands` */
export interface BrandRow {
  id: string;
  slug: BrandId | string;
  name: string;
  category: string | null;
  color: string;
  pillars: string[];
  ideas: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Row dari tabel `social_account_snapshots` */
export interface SocialSnapshot {
  id: string;
  brand_id: string;
  platform: string;
  username: string | null;
  profile_url: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  followers: number | null;
  posts_count: number | null;
  total_likes: number | null;
  total_views: number | null;
  avg_likes: number | null;
  avg_views: number | null;
  recent_posts: RecentPost[];
  source: string;
  sync_status: string;
  sync_message: string | null;
  synced_at: string;
  created_at: string;
}

export interface RecentPost {
  url?: string;
  caption?: string;
  likes?: number;
  views?: number;
  type?: "reel" | "post";
  date?: string;
}

/** Payload untuk create/update content item */
export interface ContentItemInput {
  brand_id: string;
  title: string;
  hook?: string | null;
  concept?: string | null;
  caption?: string | null;
  cta?: string | null;
  visual_notes?: string | null;
  audience?: string | null;
  hashtags?: string[];
  content_pillar?: string | null;
  platform: Platform;
  format?: string | null;
  objective?: string | null;
  style?: string | null;
  production_status?: string;
  workflow_stage?: WorkflowStage;
  talent_count?: number | null;
  planned_date?: string | null;
  shoot_date?: string | null;
  link_ref?: string | null;
  published_url?: string | null;
  duration_seconds?: number | null;
  reason?: string | null;
  notes?: string | null;
  created_by_name?: string | null;
}
/** Payload untuk create content_idea */
export interface ContentIdeaInput {
  brand_id: string;
  title: string;
  hook?: string | null;
  concept?: string | null;
  caption?: string | null;
  cta?: string | null;
  audience?: string | null;
  content_pillar?: string | null;
  platform?: string | null;
  format?: string | null;
  objective?: string | null;
  style?: string | null;
  visual_notes?: string | null;
  flow?: string[];
  hashtags?: string[];
  duration_seconds?: number | null;
  source?: "manual" | "template" | "AI";
  reason?: string | null;
}
