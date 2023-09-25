ALTER TABLE public.pages enable row level security;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."pages";

CREATE POLICY "Enable insert for authenticated users only" ON "public"."pages"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."pages";

CREATE POLICY "Enable select for users based on user_id" ON "public"."pages"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."pages";

CREATE POLICY "Enable update for users based on user_id" ON "public"."pages"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."pages";

CREATE POLICY "Enable delete for users based on user_id" ON "public"."pages"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (auth.uid() = user_id);