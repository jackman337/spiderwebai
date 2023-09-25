DROP POLICY IF EXISTS "Enable select for users based on email" ON "public"."profiles";

CREATE POLICY "Enable select for users based on email" ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO public
USING (auth.jwt() ->> 'email' = email)
