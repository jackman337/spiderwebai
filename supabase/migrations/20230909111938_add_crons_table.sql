create table if not exists
  public.crons (
    id uuid not null default gen_random_uuid (),
    user_id uuid null,
    domain text not null,
    cron_frequency text,
    cron text,
    last_ran_at timestamp with time zone null, 
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    UNIQUE (user_id, domain),
    constraint cronpkey primary key (id),
    constraint cron_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
    constraint cron_domain_fkey foreign key (user_id, domain) references websites (user_id, domain) on delete cascade
  ) tablespace pg_default;

ALTER TABLE public.crons enable row level security;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."crons";

CREATE POLICY "Enable insert for authenticated users only" ON "public"."crons"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."crons";

CREATE POLICY "Enable select for users based on user_id" ON "public"."crons"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."crons";

CREATE POLICY "Enable update for users based on user_id" ON "public"."crons"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."crons";

CREATE POLICY "Enable delete for users based on user_id" ON "public"."crons"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);