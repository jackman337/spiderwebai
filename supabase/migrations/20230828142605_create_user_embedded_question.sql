CREATE EXTENSION IF NOT EXISTS vector with schema extensions;

create table if not exists
  public.questions (
    id uuid not null default gen_random_uuid (),
    user_id uuid null,
    url character varying null,
    domain text null,
    content text not null,
    answer text null,
    embedding vector(1536) null,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    constraint questions_pkey primary key (id),
    constraint questions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
    constraint questions_domain_fkey foreign key (user_id, domain) references websites (user_id, domain) on delete cascade
  ) tablespace pg_default;

create index on questions using ivfflat (embedding vector_cosine_ops)
with
  (lists = 100);