ALTER TABLE public.questions enable row level security;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."questions";

CREATE POLICY "Enable insert for authenticated users only" ON "public"."questions"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."questions";

CREATE POLICY "Enable select for users based on user_id" ON "public"."questions"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."questions";

CREATE POLICY "Enable update for users based on user_id" ON "public"."questions"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."questions";

CREATE POLICY "Enable delete for users based on user_id" ON "public"."questions"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);