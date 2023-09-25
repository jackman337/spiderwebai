ALTER TABLE public.report_feature enable row level security;
ALTER TABLE public.team_billing enable row level security;
ALTER TABLE public.team_member enable row level security;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."team_billing";

CREATE POLICY "Enable insert for authenticated users only" ON "public"."team_billing"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."team_billing";

CREATE POLICY "Enable select for users based on user_id" ON "public"."team_billing"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."team_billing";

CREATE POLICY "Enable update for users based on user_id" ON "public"."team_billing"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."team_billing";

CREATE POLICY "Enable delete for users based on user_id" ON "public"."team_billing"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."team_member";

CREATE POLICY "Enable insert for authenticated users only" ON "public"."team_member"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."team_member";

CREATE POLICY "Enable select for users based on user_id" ON "public"."team_member"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."team_member";

CREATE POLICY "Enable update for users based on user_id" ON "public"."team_member"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."team_member";

CREATE POLICY "Enable delete for users based on user_id" ON "public"."team_member"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
