create or replace function match_page_sections(
    embedding vector(1536),
    match_threshold float,
    match_count int,
    min_content_length int
)
returns table (
    id uuid,
    user_id uuid,
    title text,
    description text,
    resource_type text,
    domain text,
    url character,
    similarity float
)
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select
    pages_metadata.id,
    pages_metadata.user_id,
    pages_metadata.title,
    pages_metadata.description,
    pages_metadata.resource_type,
    pages_metadata.domain,
    pages_metadata.url,
    (pages_metadata.embedding <#> embedding) * -1 as similarity
  from pages_metadata

  where length(pages_metadata.description) >= min_content_length

  and (pages_metadata.embedding <#> embedding) * -1 > match_threshold

  order by pages_metadata.embedding <#> embedding

  limit match_count;
end;
$$;