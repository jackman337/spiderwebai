create or replace function increment_credits (c int, u uuid)  
RETURNS SETOF public.credits AS $$
update credits
set credits = credits + c
where user_id = u
RETURNING *;
$$ language sql volatile;