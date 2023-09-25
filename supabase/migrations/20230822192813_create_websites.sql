create table if not exists
  public.websites (
    id uuid not null default gen_random_uuid (),
    user_id uuid null,
    url character varying not null,
    domain text not null,
    headless boolean,
    proxy boolean,
    crawl_budget jsonb null,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    UNIQUE (user_id, domain),
    constraint websites_pkey primary key (id),
    constraint websites_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;