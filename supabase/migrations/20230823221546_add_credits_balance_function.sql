create or replace function get_credits_balance()
returns integer as $$
  select sum(credits.credits)
  from credits
  where user_id = auth.uid()
  group by user_id
$$ LANGUAGE SQL IMMUTABLE;