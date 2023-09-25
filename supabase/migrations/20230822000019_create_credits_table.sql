create table if not exists
  public.credits (
    id uuid not null default gen_random_uuid(),
    user_id uuid null,
    credits bigint null,
    team_id uuid null,
    created_at timestamp with time zone null default now(),
    updated_at timestamp with time zone null default now(),
    constraint credits_pkey primary key (id),
    constraint credits_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
  ) tablespace pg_default;