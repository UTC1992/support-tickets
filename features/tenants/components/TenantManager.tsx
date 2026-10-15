"use client";

import { Building2, LoaderCircle, Pencil, Plus, Power, X } from "lucide-react";
import type { FormEvent } from "react";
import PasswordInput from "@/features/auth/components/PasswordInput";
import useTenantManager from "@/features/tenants/hooks/useTenantManager";
import type { TenantItem } from "@/features/tenants/types";

type TenantManagerProps = { initialTenants: TenantItem[] };

const TenantManager = ({ initialTenants }: TenantManagerProps) => {
  const {
    close,
    closeEdit,
    createTenant,
    editingTenant,
    error,
    isOpen,
    isSaving,
    isUpdating,
    open,
    openEdit,
    successMessage,
    tenants,
    toggleTenant,
    updateTenantDetails,
    updatingTenantId,
  } = useTenantManager(initialTenants);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createTenant(new FormData(event.currentTarget));
  };

  const submitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateTenantDetails(new FormData(event.currentTarget));
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={open} className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">
          <Plus aria-hidden="true" className="size-4" /> Crear empresa
        </button>
      </div>
      {error && !isOpen && !editingTenant ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
      {successMessage ? <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{successMessage}</p> : null}
      <div className="overflow-hidden border-y border-zinc-200 bg-white sm:rounded-md sm:border">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 last:border-0">
            <Building2 aria-hidden="true" className="size-5 shrink-0 text-zinc-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{tenant.name}</p>
              <p className="truncate text-xs text-zinc-500">{tenant.slug} · {tenant._count.profiles} usuarios · {tenant._count.tickets} soportes · {tenant.isActive ? "Activa" : "Inactiva"}</p>
            </div>
            <button type="button" onClick={() => openEdit(tenant)} title="Editar empresa" aria-label={`Editar ${tenant.name}`} className="grid size-11 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100">
              <Pencil aria-hidden="true" className="size-4" />
            </button>
            <button type="button" onClick={() => toggleTenant(tenant)} disabled={updatingTenantId === tenant.id} title={tenant.isActive ? "Desactivar empresa" : "Activar empresa"} aria-label={tenant.isActive ? `Desactivar ${tenant.name}` : `Activar ${tenant.name}`} className={`grid size-11 place-items-center rounded-md hover:bg-zinc-100 disabled:opacity-50 ${tenant.isActive ? "text-emerald-700" : "text-red-600"}`}>
              {updatingTenantId === tenant.id
                ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                : <Power aria-hidden="true" className="size-4" />}
            </button>
          </div>
        ))}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="tenant-form-title">
          <form onSubmit={submit} className="max-h-dvh w-full overflow-y-auto bg-white p-5 shadow-xl sm:max-w-md sm:rounded-md">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="tenant-form-title" className="text-lg font-semibold">Crear empresa</h2>
              <button type="button" onClick={close} aria-label="Cerrar" className="grid size-11 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button>
            </div>
            <label className="block text-sm font-medium">Nombre de la empresa<input name="name" required autoFocus className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label>
            <label className="mt-4 block text-sm font-medium">Identificador<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="mi-empresa" className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base lowercase outline-none focus:border-zinc-900" /></label>
            <label className="mt-4 block text-sm font-medium">Nombre del propietario<input name="ownerName" required className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label>
            <label className="mt-4 block text-sm font-medium">Correo del propietario<input name="ownerEmail" type="email" required autoComplete="email" className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label>
            <div className="mt-4"><PasswordInput name="password" label="Contraseña temporal" minLength={8} required autoComplete="new-password" /></div>
            {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={close} className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cancelar</button>
              <button type="submit" disabled={isSaving} className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">{isSaving ? "Creando..." : "Crear"}</button>
            </div>
          </form>
        </div>
      ) : null}

      {editingTenant ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="tenant-edit-title">
          <form onSubmit={submitEdit} className="w-full bg-white p-5 shadow-xl sm:max-w-md sm:rounded-md">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="tenant-edit-title" className="text-lg font-semibold">Editar empresa</h2>
              <button type="button" onClick={closeEdit} aria-label="Cerrar" className="grid size-11 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button>
            </div>
            <label className="block text-sm font-medium">Nombre de la empresa<input name="name" required autoFocus defaultValue={editingTenant.name} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label>
            {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeEdit} className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cancelar</button>
              <button type="submit" disabled={isUpdating} className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">{isUpdating ? "Guardando..." : "Guardar cambios"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default TenantManager;
