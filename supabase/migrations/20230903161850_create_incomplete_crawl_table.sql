create table if not exists
  public.crawl_state (
    id uuid not null default gen_random_uuid (),
    user_id uuid null,
    url character varying not null,
    domain text not null,
    links integer not null,
    credits_used integer not null,
    mode integer,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    UNIQUE (user_id, domain),
    constraint crawls_shutdown_pkey primary key (id),
    constraint crawls_shutdown_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
    constraint crawls_shutdown_domain_fkey foreign key (user_id, domain) references websites (user_id, domain) on delete cascade
  ) tablespace pg_default;

ALTER TABLE public.crawl_state enable row level security;

alter publication supabase_realtime add table crawl_state;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."crawl_state";

CREATE POLICY "Enable insert for authenticated users only" ON "public"."crawl_state"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."crawl_state";

CREATE POLICY "Enable select for users based on user_id" ON "public"."crawl_state"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."crawl_state";

CREATE POLICY "Enable update for users based on user_id" ON "public"."crawl_state"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."crawl_state";

CREATE POLICY "Enable delete for users based on user_id" ON "public"."crawl_state"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);