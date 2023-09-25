create table if not exists 
  public.profiles (
    id uuid not null references auth.users on delete cascade,
    email text not null,
    stripe_id text,
    is_deleted boolean,
    proxy boolean,
    headless boolean,
    crawl_budget jsonb null,
    billing_limit int8 default 0,
    billing_limit_soft int8 default 0,
    approved_usage int8 default 0,
    primary key (id)
  );

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  insert into public.credits (user_id, credits)
  values (new.id, 0);
  return new;
end;
$$ language plpgsql security definer;

-- trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();