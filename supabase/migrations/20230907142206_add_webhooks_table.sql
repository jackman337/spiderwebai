create table if not exists
  public.webhooks (
    id uuid not null default gen_random_uuid (),
    user_id uuid null,
    domain text null,
    destination character varying not null,
    on_credits_depleted boolean,
    on_credits_half_depleted boolean,
    on_find boolean,
    on_find_metadata boolean,
    on_website_status boolean,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    UNIQUE (user_id, domain),
    constraint webhooks_pkey primary key (id),
    constraint webhooks_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
    constraint webhooks_domain_fkey foreign key (user_id, domain) references websites (user_id, domain) on delete cascade
  ) tablespace pg_default;

ALTER TABLE public.webhooks enable row level security;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."webhooks";

CREATE POLICY "Enable insert for authenticated users only" ON "public"."webhooks"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."webhooks";

CREATE POLICY "Enable select for users based on user_id" ON "public"."webhooks"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."webhooks";

CREATE POLICY "Enable update for users based on user_id" ON "public"."webhooks"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."webhooks";

CREATE POLICY "Enable delete for users based on user_id" ON "public"."webhooks"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
