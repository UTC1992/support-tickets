create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('admin', 'office', 'technician');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_status as enum (
    'pending',
    'assigned',
    'in_progress',
    'completed',
    'not_completed',
    'rescheduled',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'office',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  export_group text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_phone text,
  client_ip text,
  sector text,
  zone_id uuid references public.zones(id) on delete set null,
  support_type_id uuid references public.support_types(id) on delete set null,
  technician_id uuid references public.technicians(id) on delete set null,
  status public.ticket_status not null default 'pending',
  priority public.ticket_priority not null default 'normal',
  intake_date date not null default current_date,
  scheduled_at timestamptz,
  completed_at timestamptz,
  observation text,
  technician_notes text,
  result_notes text,
  source_sheet text,
  source_row integer,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tickets_completed_status_check check (
    (status = 'completed' and completed_at is not null)
    or status <> 'completed'
  )
);

create table if not exists public.ticket_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  old_value jsonb,
  new_value jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists tickets_status_idx on public.tickets(status);
create index if not exists tickets_intake_date_idx on public.tickets(intake_date desc);
create index if not exists tickets_technician_id_idx on public.tickets(technician_id);
create index if not exists tickets_zone_id_idx on public.tickets(zone_id);
create index if not exists tickets_support_type_id_idx on public.tickets(support_type_id);
create index if not exists tickets_search_idx on public.tickets
  using gin (to_tsvector('spanish', coalesce(client_name, '') || ' ' || coalesce(sector, '') || ' ' || coalesce(observation, '')));
create index if not exists ticket_history_ticket_id_idx on public.ticket_history(ticket_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_zones_updated_at on public.zones;
create trigger set_zones_updated_at
before update on public.zones
for each row execute function public.set_updated_at();

drop trigger if exists set_technicians_updated_at on public.technicians;
create trigger set_technicians_updated_at
before update on public.technicians
for each row execute function public.set_updated_at();

drop trigger if exists set_support_types_updated_at on public.support_types;
create trigger set_support_types_updated_at
before update on public.support_types
for each row execute function public.set_updated_at();

drop trigger if exists set_tickets_updated_at on public.tickets;
create trigger set_tickets_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid() and is_active = true),
    'office'::public.app_role
  );
$$;

alter table public.profiles enable row level security;
alter table public.zones enable row level security;
alter table public.technicians enable row level security;
alter table public.support_types enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_history enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_app_role() = 'admin');

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update
to authenticated
using (public.current_app_role() = 'admin')
with check (public.current_app_role() = 'admin');

drop policy if exists "catalog_select_authenticated" on public.zones;
create policy "catalog_select_authenticated"
on public.zones for select
to authenticated
using (true);

drop policy if exists "zones_write_admin_office" on public.zones;
create policy "zones_write_admin_office"
on public.zones for all
to authenticated
using (public.current_app_role() in ('admin', 'office'))
with check (public.current_app_role() in ('admin', 'office'));

drop policy if exists "technicians_select_authenticated" on public.technicians;
create policy "technicians_select_authenticated"
on public.technicians for select
to authenticated
using (true);

drop policy if exists "technicians_write_admin_office" on public.technicians;
create policy "technicians_write_admin_office"
on public.technicians for all
to authenticated
using (public.current_app_role() in ('admin', 'office'))
with check (public.current_app_role() in ('admin', 'office'));

drop policy if exists "support_types_select_authenticated" on public.support_types;
create policy "support_types_select_authenticated"
on public.support_types for select
to authenticated
using (true);

drop policy if exists "support_types_write_admin_office" on public.support_types;
create policy "support_types_write_admin_office"
on public.support_types for all
to authenticated
using (public.current_app_role() in ('admin', 'office'))
with check (public.current_app_role() in ('admin', 'office'));

drop policy if exists "tickets_select_authenticated" on public.tickets;
create policy "tickets_select_authenticated"
on public.tickets for select
to authenticated
using (true);

drop policy if exists "tickets_insert_authenticated" on public.tickets;
create policy "tickets_insert_authenticated"
on public.tickets for insert
to authenticated
with check (true);

drop policy if exists "tickets_update_authenticated" on public.tickets;
create policy "tickets_update_authenticated"
on public.tickets for update
to authenticated
using (true)
with check (true);

drop policy if exists "tickets_delete_admin" on public.tickets;
create policy "tickets_delete_admin"
on public.tickets for delete
to authenticated
using (public.current_app_role() = 'admin');

drop policy if exists "ticket_history_select_authenticated" on public.ticket_history;
create policy "ticket_history_select_authenticated"
on public.ticket_history for select
to authenticated
using (true);

drop policy if exists "ticket_history_insert_authenticated" on public.ticket_history;
create policy "ticket_history_insert_authenticated"
on public.ticket_history for insert
to authenticated
with check (true);

insert into public.zones (name)
values
  ('SAQUISILI'),
  ('TANICUCHI'),
  ('TOACASO'),
  ('LASSO'),
  ('GUAYTACAMA')
on conflict (name) do nothing;

insert into public.support_types (name, export_group)
values
  ('SOPORTE TECNICO', 'SOPORTE'),
  ('SOPORTE FIBRA', 'FIBRA'),
  ('RADIO ENLACE', 'RADIO ENLACE'),
  ('INSTALACION', 'INSTALACIONES'),
  ('SOPORTE CAMARA', 'CAMARAS'),
  ('RETIRO DE EQUIPOS', 'RETIRO DE EQUIPOS'),
  ('MIGRACION A FIBRA', 'MIGRACIONES'),
  ('EQUIPOS APAGADOS', 'EQUIPOS APAGADOS'),
  ('CAMBIO DE DOMICILIO', 'SOPORTE')
on conflict (name) do nothing;

insert into public.technicians (name)
values
  ('Edwin'),
  ('Ismael'),
  ('Geovanny'),
  ('Guillo')
on conflict do nothing;
