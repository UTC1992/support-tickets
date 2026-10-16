alter table public.zones rename to sectors;

alter table public.sectors rename constraint zones_pkey to sectors_pkey;
alter table public.sectors rename constraint zones_tenant_id_fkey to sectors_tenant_id_fkey;
alter index public.zones_tenant_id_name_key rename to sectors_tenant_id_name_key;
alter index public.zones_tenant_id_is_active_idx rename to sectors_tenant_id_is_active_idx;
alter trigger set_zones_updated_at on public.sectors rename to set_sectors_updated_at;
alter policy "zones_tenant_select" on public.sectors rename to "sectors_tenant_select";
alter policy "zones_admin_write" on public.sectors rename to "sectors_admin_write";

alter table public.tickets rename column sector to address;
alter table public.tickets rename column zone_id to sector_id;
alter table public.tickets rename constraint tickets_zone_id_fkey to tickets_sector_id_fkey;
alter index public.tickets_zone_id_idx rename to tickets_sector_id_idx;
