-- ============================================================
-- 003 ROW LEVEL SECURITY — semua authenticated boleh CRUD
-- ============================================================

-- Aktifkan RLS
alter table profiles                  enable row level security;
alter table brands                    enable row level security;
alter table content_items             enable row level security;
alter table content_ideas             enable row level security;
alter table social_account_snapshots  enable row level security;
alter table integration_sync_logs     enable row level security;
alter table ai_generations            enable row level security;

-- Helper: drop policy jika sudah ada (idempotent)
do $$
declare
  t text;
  p text;
begin
  for t, p in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', p, t);
  end loop;
end $$;

-- ── profiles ───────────────────────────────────────────
create policy "auth_read_profiles"   on profiles for select to authenticated using (true);
create policy "auth_insert_profiles" on profiles for insert to authenticated with check (true);
create policy "auth_update_profiles" on profiles for update to authenticated using (true);

-- ── brands ─────────────────────────────────────────────
create policy "auth_read_brands"   on brands for select to authenticated using (true);
create policy "auth_insert_brands" on brands for insert to authenticated with check (true);
create policy "auth_update_brands" on brands for update to authenticated using (true);
create policy "auth_delete_brands" on brands for delete to authenticated using (true);

-- ── content_items ──────────────────────────────────────
create policy "auth_read_content"   on content_items for select to authenticated using (true);
create policy "auth_insert_content" on content_items for insert to authenticated with check (true);
create policy "auth_update_content" on content_items for update to authenticated using (true);
create policy "auth_delete_content" on content_items for delete to authenticated using (true);

-- ── content_ideas ──────────────────────────────────────
create policy "auth_read_ideas"   on content_ideas for select to authenticated using (true);
create policy "auth_insert_ideas" on content_ideas for insert to authenticated with check (true);
create policy "auth_update_ideas" on content_ideas for update to authenticated using (true);
create policy "auth_delete_ideas" on content_ideas for delete to authenticated using (true);

-- ── social_account_snapshots ───────────────────────────
create policy "auth_read_snapshots"   on social_account_snapshots for select to authenticated using (true);
create policy "auth_insert_snapshots" on social_account_snapshots for insert to authenticated with check (true);
create policy "auth_update_snapshots" on social_account_snapshots for update to authenticated using (true);
create policy "auth_delete_snapshots" on social_account_snapshots for delete to authenticated using (true);

-- ── integration_sync_logs ──────────────────────────────
create policy "auth_read_logs"   on integration_sync_logs for select to authenticated using (true);
create policy "auth_insert_logs" on integration_sync_logs for insert to authenticated with check (true);

-- ── ai_generations ─────────────────────────────────────
create policy "auth_read_ai"   on ai_generations for select to authenticated using (true);
create policy "auth_insert_ai" on ai_generations for insert to authenticated with check (true);