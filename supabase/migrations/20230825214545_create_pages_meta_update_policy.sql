alter table "public"."pages_metadata" enable row level security;

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."pages_metadata";

create policy "Enable update for users based on user_id"
on "public"."pages_metadata"
as permissive
for update
to public
using ((auth.uid() = user_id));