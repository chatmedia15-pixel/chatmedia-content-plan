-- ============================================================
-- 004 RPC — transisi workflow_stage (atomik, anti-duplikat)
-- ============================================================

create or replace function move_content_stage(
  p_id uuid,
  p_new_stage workflow_stage,
  p_published_url text default null
)
returns content_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item content_items;
begin
  -- Validasi item ada
  if not exists (select 1 from content_items where id = p_id) then
    raise exception 'Content item % tidak ditemukan', p_id
      using errcode = 'P0002';
  end if;

  update content_items
  set
    workflow_stage = p_new_stage,
    production_status = case
      when p_new_stage = 'published' then production_status  -- biarkan
      else production_status
    end,
    published_at = case
      when p_new_stage = 'published' and published_at is null then now()
      else published_at
    end,
    published_url = coalesce(p_published_url, published_url)
  where id = p_id
  returning * into v_item;

  return v_item;
end;
$$;

-- Grant execute ke authenticated
revoke all on function move_content_stage(uuid, workflow_stage, text) from public;
grant execute on function move_content_stage(uuid, workflow_stage, text) to authenticated;