create table if not exists
  public.report_feature (
    id uuid not null default gen_random_uuid (),
    user_id uuid null,
    feature_request text not null,
    feature_body text null,
    feature_type text null,
    email text not null,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    UNIQUE (user_id, feature_request),
    constraint report_feature_pkey primary key (id),
    constraint report_feature_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;


DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."report_feature";

CREATE POLICY "Enable insert for authenticated users only" ON "public"."report_feature"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."report_feature";

CREATE POLICY "Enable select for users based on user_id" ON "public"."report_feature"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."report_feature";

CREATE POLICY "Enable update for users based on user_id" ON "public"."report_feature"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."report_feature";

CREATE POLICY "Enable delete for users based on user_id" ON "public"."report_feature"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);