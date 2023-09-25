CREATE EXTENSION IF NOT EXISTS vector with schema extensions;

create table if not exists 
  public.pages_metadata (
    id uuid not null default gen_random_uuid (),
    user_id uuid null,
    url character varying not null,
    domain text not null,
    resource_type text not null,
    title text not null,
    description text not null,
    file_size int8 null,
    embedding vector(1536) null,
    pathname text,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    UNIQUE (user_id, domain, url),
    constraint pages_metadata_pkey primary key (id),
    constraint pages_metadata_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
    constraint pages_metadata_domain_fkey foreign key (user_id, domain) references websites (user_id, domain) on delete cascade
  ) tablespace pg_default;

create index on pages_metadata using ivfflat (embedding vector_cosine_ops)
with
  (lists = 100);