create or replace function upsert_pages(
    user_id uuid,
    url character,
    domain character
)
returns table (
    id uuid
)
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  INSERT INTO pages
    VALUES(gen_random_uuid(), user_id, url, now(), now(), domain)
    ON CONFLICT(user_id, url, domain) DO UPDATE SET updated_at = now();
end;
$$;