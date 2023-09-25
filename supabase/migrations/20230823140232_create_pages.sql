create table if not exists
  public.pages (
    id uuid not null default gen_random_uuid (),
    user_id uuid null,
    url character varying not null,
    domain text not null,
    pathname text,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    fts tsvector generated always as (to_tsvector('english', pathname)) stored,
    UNIQUE (user_id, domain, url),
    constraint pages_pkey primary key (id),
    constraint pages_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
    constraint pages_domain_fkey foreign key (user_id, domain) references websites (user_id, domain) on delete cascade
  ) tablespace pg_default;

create index pages_fts on pages using gin (fts);

alter publication supabase_realtime add table pages;