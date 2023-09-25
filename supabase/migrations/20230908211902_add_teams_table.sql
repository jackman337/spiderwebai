create table if not exists
  public.teams (
    id uuid not null,
    is_deleted boolean,
    team_name text,
    primary key (id)
  );

create table if not exists
  public.team_member (
    id uuid not null,
    user_id uuid not null,
    email text not null,
    stripe_id text,
    is_deleted boolean,
    team_name text,
    team_id uuid not null,
    team_role integer,
    primary key (id)
  );

create table if not exists
  public.team_billing (
    id uuid not null,
    email text not null,
    stripe_id text,
    is_deleted boolean,
    team_name text,
    user_id uuid null,
    team_id uuid not null,
    billing_address1 text null,
    billing_address2 text null,
    billing_city text null,
    billing_state text null,
    billing_postal_code text null,
    primary key (id)
  );

alter table public.teams enable row level security;