"use client";

import { Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { createAdminResourceRequest, deleteAdminResourceRequest, updateAdminResourceRequest } from "@/lib/services/admin-resource-api-service";

type CatalogItem = {
  id: string;
  name: string;
  phone?: string | null;
  exportGroup?: string;
  isActive: boolean;
  ticketCount: number;
};

type CatalogManagerProps = {
  initialItems: CatalogItem[];
  resource: "zones" | "technicians" | "support-types";
  itemLabel: string;
  secondaryField?: "phone" | "exportGroup";
};

const CatalogManager = ({ initialItems, resource, itemLabel, secondaryField }: CatalogManagerProps) => {
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setIsOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setError(null);
    setIsOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    const formData = new FormData(event.currentTarget);
    const body: Record<string, unknown> = { name: String(formData.get("name") ?? "") };
    if (secondaryField) body[secondaryField] = String(formData.get(secondaryField) ?? "");

    try {
      if (editing) {
        const updated = await updateAdminResourceRequest<Omit<CatalogItem, "ticketCount"> & { _count?: { tickets: number } }>(resource, editing.id, body);
        setItems((current) => current.map((item) => item.id === editing.id ? { ...item, ...updated, ticketCount: updated._count?.tickets ?? item.ticketCount } : item));
      } else {
        const created = await createAdminResourceRequest<Omit<CatalogItem, "ticketCount"> & { _count?: { tickets: number } }>(resource, body);
        setItems((current) => [...current, { ...created, ticketCount: created._count?.tickets ?? 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setIsOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (item: CatalogItem) => {
    setError(null);
    try {
      const updated = await updateAdminResourceRequest<CatalogItem>(resource, item.id, { isActive: !item.isActive });
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, isActive: updated.isActive } : currentItem));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo actualizar");
    }
  };

  const remove = async (item: CatalogItem) => {
    if (!window.confirm(`Eliminar ${item.name}?`)) return;
    setError(null);
    try {
      await deleteAdminResourceRequest(resource, item.id);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo eliminar");
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">
          <Plus aria-hidden="true" className="size-4" /> Anadir {itemLabel}
        </button>
      </div>

      {error && !isOpen ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="overflow-hidden border-y border-zinc-200 bg-white sm:rounded-md sm:border">
        {items.length === 0 ? <p className="px-4 py-12 text-center text-sm text-zinc-500">No hay registros.</p> : (
          <div className="divide-y divide-zinc-200">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-950">{item.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {secondaryField === "phone" ? item.phone || "Sin telefono" : null}
                    {secondaryField === "exportGroup" ? `Grupo: ${item.exportGroup}` : null}
                    {secondaryField ? " · " : ""}{item.ticketCount} soportes · {item.isActive ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <button type="button" onClick={() => openEdit(item)} title="Editar" aria-label={`Editar ${item.name}`} className="grid size-9 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100"><Pencil className="size-4" /></button>
                <button type="button" onClick={() => toggleActive(item)} title={item.isActive ? "Desactivar" : "Activar"} aria-label={item.isActive ? `Desactivar ${item.name}` : `Activar ${item.name}`} className="grid size-9 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100"><Power className="size-4" /></button>
                <button type="button" onClick={() => remove(item)} title="Eliminar" aria-label={`Eliminar ${item.name}`} className="grid size-9 place-items-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit} className="w-full bg-white p-5 shadow-xl sm:max-w-md sm:rounded-md">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{editing ? `Editar ${itemLabel}` : `Nuevo ${itemLabel}`}</h3>
              <button type="button" onClick={() => setIsOpen(false)} title="Cerrar" aria-label="Cerrar" className="grid size-9 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button>
            </div>
            <label className="block text-sm font-medium text-zinc-800">Nombre
              <input name="name" defaultValue={editing?.name} required autoFocus className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" />
            </label>
            {secondaryField === "phone" ? <label className="mt-4 block text-sm font-medium text-zinc-800">Telefono<input name="phone" defaultValue={editing?.phone ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label> : null}
            {secondaryField === "exportGroup" ? <label className="mt-4 block text-sm font-medium text-zinc-800">Grupo para Excel<input name="exportGroup" defaultValue={editing?.exportGroup ?? ""} required className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label> : null}
            {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setIsOpen(false)} className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50">Cancelar</button>
              <button type="submit" disabled={isSaving} className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:bg-zinc-400">{isSaving ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default CatalogManager;
