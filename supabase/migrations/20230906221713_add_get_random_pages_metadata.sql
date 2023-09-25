ALTER TABLE pages_metadata ALTER COLUMN title SET not null;
ALTER TABLE pages_metadata ALTER COLUMN description SET not null;

create or replace function get_random_pages_metadata(dname text)
returns setof pages_metadata
language sql
as $$
   select * from pages_metadata
   where user_id = auth.uid()
   and domain = dname
   and title <> ''
   order by random()
   limit 20;
$$;