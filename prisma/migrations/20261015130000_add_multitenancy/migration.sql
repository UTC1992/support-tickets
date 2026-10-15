create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.tenants (name, slug)
values ('Exitcomp', 'exitcomp')
on conflict (slug) do nothing;

alter table public.profiles add column tenant_id uuid;
alter table public.zones add column tenant_id uuid;
alter table public.technicians add column tenant_id uuid;
alter table public.support_types add column tenant_id uuid;
alter table public.tickets add column tenant_id uuid;
alter table public.ticket_history add column tenant_id uuid;

update public.profiles set tenant_id = (select id from public.tenants where slug = 'exitcomp');
update public.zones set tenant_id = (select id from public.tenants where slug = 'exitcomp');
update public.technicians set tenant_id = (select id from public.tenants where slug = 'exitcomp');
update public.support_types set tenant_id = (select id from public.tenants where slug = 'exitcomp');
update public.tickets set tenant_id = (select id from public.tenants where slug = 'exitcomp');
update public.ticket_history history
set tenant_id = ticket.tenant_id
from public.tickets ticket
where ticket.id = history.ticket_id;

insert into public.platform_admins (user_id)
select id from public.profiles where role = 'admin'
on conflict (user_id) do nothing;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "catalog_select_authenticated" on public.zones;
drop policy if exists "zones_write_admin_office" on public.zones;
drop policy if exists "technicians_select_authenticated" on public.technicians;
drop policy if exists "technicians_write_admin_office" on public.technicians;
drop policy if exists "support_types_select_authenticated" on public.support_types;
drop policy if exists "support_types_write_admin_office" on public.support_types;
drop policy if exists "tickets_select_authenticated" on public.tickets;
drop policy if exists "tickets_insert_authenticated" on public.tickets;
drop policy if exists "tickets_update_authenticated" on public.tickets;
drop policy if exists "tickets_delete_admin" on public.tickets;
drop policy if exists "ticket_history_select_authenticated" on public.ticket_history;
drop policy if exists "ticket_history_insert_authenticated" on public.ticket_history;
drop function if exists public.current_app_role();

alter table public.profiles alter column role drop default;
alter type public.app_role rename to app_role_legacy;
create type public.app_role as enum ('owner', 'admin', 'technician');
alter table public.profiles
  alter column role type public.app_role
  using (
    case role::text
      when 'admin' then 'owner'
      when 'office' then 'admin'
      else 'technician'
    end
  )::public.app_role;
alter table public.profiles alter column role set default 'technician';
drop type public.app_role_legacy;

alter table public.profiles alter column tenant_id set not null;
alter table public.zones alter column tenant_id set not null;
alter table public.technicians alter column tenant_id set not null;
alter table public.support_types alter column tenant_id set not null;
alter table public.tickets alter column tenant_id set not null;
alter table public.ticket_history alter column tenant_id set not null;

alter table public.profiles add constraint profiles_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.zones add constraint zones_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.technicians add constraint technicians_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.support_types add constraint support_types_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.tickets add constraint tickets_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;
alter table public.ticket_history add constraint ticket_history_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade;

alter table public.zones drop constraint if exists zones_name_key;
alter table public.support_types drop constraint if exists support_types_name_key;
create unique index zones_tenant_id_name_key on public.zones(tenant_id, name);
create unique index support_types_tenant_id_name_key on public.support_types(tenant_id, name);
create index profiles_tenant_id_role_idx on public.profiles(tenant_id, role);
create index zones_tenant_id_is_active_idx on public.zones(tenant_id, is_active);
create index technicians_tenant_id_is_active_idx on public.technicians(tenant_id, is_active);
create index support_types_tenant_id_is_active_idx on public.support_types(tenant_id, is_active);
create index tickets_tenant_id_status_idx on public.tickets(tenant_id, status);
create index tickets_tenant_id_intake_date_idx on public.tickets(tenant_id, intake_date desc);
create index ticket_history_tenant_id_created_at_idx on public.ticket_history(tenant_id, created_at desc);

drop trigger if exists set_tenants_updated_at on public.tenants;
create trigger set_tenants_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = auth.uid() and is_active = true
  );
$$;

alter table public.tenants enable row level security;
alter table public.platform_admins enable row level security;

create policy "platform_admins_select_own"
on public.platform_admins for select to authenticated
using (user_id = auth.uid());

create policy "tenants_platform_admin_all"
on public.tenants for all to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

create policy "tenants_members_select"
on public.tenants for select to authenticated
using (id = public.current_tenant_id());

create policy "profiles_tenant_select"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or (
    tenant_id = public.current_tenant_id()
    and (
      (public.current_app_role() = 'owner' and role = 'admin')
      or (public.current_app_role() = 'admin' and role = 'technician')
    )
  )
);

create policy "profiles_tenant_update"
on public.profiles for update to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    (public.current_app_role() = 'owner' and role = 'admin')
    or (public.current_app_role() = 'admin' and role = 'technician')
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and (
    (public.current_app_role() = 'owner' and role = 'admin')
    or (public.current_app_role() = 'admin' and role = 'technician')
  )
);

create policy "zones_tenant_select" on public.zones for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('admin', 'technician')
);
create policy "zones_admin_write" on public.zones for all to authenticated
using (tenant_id = public.current_tenant_id() and public.current_app_role() = 'admin')
with check (tenant_id = public.current_tenant_id() and public.current_app_role() = 'admin');

create policy "technicians_tenant_select" on public.technicians for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_app_role() = 'admin'
    or user_id = auth.uid()
  )
);
create policy "technicians_admin_write" on public.technicians for all to authenticated
using (tenant_id = public.current_tenant_id() and public.current_app_role() = 'admin')
with check (tenant_id = public.current_tenant_id() and public.current_app_role() = 'admin');

create policy "support_types_tenant_select" on public.support_types for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_app_role() in ('admin', 'technician')
);
create policy "support_types_admin_write" on public.support_types for all to authenticated
using (tenant_id = public.current_tenant_id() and public.current_app_role() = 'admin')
with check (tenant_id = public.current_tenant_id() and public.current_app_role() = 'admin');

create policy "tickets_tenant_select" on public.tickets for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_app_role() = 'admin'
    or technician_id in (
      select id from public.technicians
      where user_id = auth.uid() and tenant_id = public.current_tenant_id()
    )
  )
);
create policy "tickets_admin_insert" on public.tickets for insert to authenticated
with check (tenant_id = public.current_tenant_id() and public.current_app_role() = 'admin');
create policy "tickets_tenant_update" on public.tickets for update to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_app_role() = 'admin'
    or technician_id in (
      select id from public.technicians
      where user_id = auth.uid() and tenant_id = public.current_tenant_id()
    )
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.current_app_role() = 'admin'
    or technician_id in (
      select id from public.technicians
      where user_id = auth.uid() and tenant_id = public.current_tenant_id()
    )
  )
);
create policy "tickets_admin_delete" on public.tickets for delete to authenticated
using (tenant_id = public.current_tenant_id() and public.current_app_role() = 'admin');

create policy "ticket_history_tenant_select" on public.ticket_history for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_app_role() = 'admin'
    or ticket_id in (
      select ticket.id from public.tickets ticket
      join public.technicians technician on technician.id = ticket.technician_id
      where technician.user_id = auth.uid()
        and ticket.tenant_id = public.current_tenant_id()
    )
  )
);
create policy "ticket_history_tenant_insert" on public.ticket_history for insert to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.current_app_role() = 'admin'
    or ticket_id in (
      select ticket.id from public.tickets ticket
      join public.technicians technician on technician.id = ticket.technician_id
      where technician.user_id = auth.uid()
        and ticket.tenant_id = public.current_tenant_id()
    )
  )
);

revoke insert, update, delete on public.tenants from authenticated;
revoke insert, update, delete on public.platform_admins from authenticated;
revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.zones from authenticated;
revoke insert, update, delete on public.technicians from authenticated;
revoke insert, update, delete on public.support_types from authenticated;
revoke insert, update, delete on public.tickets from authenticated;
revoke insert, update, delete on public.ticket_history from authenticated;
