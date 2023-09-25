ALTER TABLE public.pages_metadata enable row level security;

DROP POLICY IF EXISTS "Enable select for users based on user_id" ON "public"."pages_metadata";

CREATE POLICY "Enable select for users based on user_id" ON "public"."pages_metadata"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);