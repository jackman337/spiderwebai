ALTER TABLE public.credits enable row level security;

DROP POLICY IF EXISTS "Enable select for credits based on user_id" ON "public"."credits";

CREATE POLICY "Enable select for credits based on user_id" ON "public"."credits"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = user_id);