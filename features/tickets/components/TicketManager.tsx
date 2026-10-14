"use client";

import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { createTicketRequest, deleteTicketRequest, updateTicketRequest } from "@/features/tickets/services/ticket-api-service";

type CatalogOption = { id: string; name: string };
type TicketItem = {
  id: string; clientName: string; clientPhone: string | null; clientIp: string | null;
  sector: string | null; zoneId: string | null; supportTypeId: string | null;
  technicianId: string | null; status: string; priority: string; intakeDate: string;
  scheduledAt: string | null; completedAt: string | null; observation: string | null;
  technicianNotes: string | null; resultNotes: string | null;
  zone: CatalogOption | null; supportType: CatalogOption | null; technician: CatalogOption | null;
};
type TicketManagerProps = {
  initialTickets: TicketItem[];
  catalogs: { zones: CatalogOption[]; supportTypes: CatalogOption[]; technicians: CatalogOption[] };
};

const statuses = [
  ["pending", "Pendiente"], ["assigned", "Asignado"], ["in_progress", "En progreso"],
  ["completed", "Completado"], ["not_completed", "No completado"], ["rescheduled", "Reprogramado"], ["cancelled", "Cancelado"],
];
const priorities = [["low", "Baja"], ["normal", "Normal"], ["high", "Alta"], ["urgent", "Urgente"]];
const labelOf = (options: string[][], value: string) => options.find(([key]) => key === value)?.[1] ?? value;
const dateValue = (value: string | null) => value ? value.slice(0, 16) : "";
const today = () => new Date().toISOString().slice(0, 10);

const TicketManager = ({ initialTickets, catalogs }: TicketManagerProps) => {
  const [tickets, setTickets] = useState(initialTickets);
  const [editing, setEditing] = useState<TicketItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visibleTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter((ticket) => [ticket.clientName, ticket.clientPhone, ticket.clientIp, ticket.sector, ticket.technician?.name].some((value) => value?.toLowerCase().includes(term)));
  }, [search, tickets]);

  const openCreate = () => { setEditing(null); setError(null); setIsOpen(true); };
  const openEdit = (ticket: TicketItem) => { setEditing(ticket); setError(null); setIsOpen(true); };
  const normalize = (ticket: TicketItem) => ({ ...ticket, intakeDate: String(ticket.intakeDate), scheduledAt: ticket.scheduledAt ? String(ticket.scheduledAt) : null, completedAt: ticket.completedAt ? String(ticket.completedAt) : null });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "");
    const status = value("status");
    const scheduledAt = value("scheduledAt");
    const body = {
      clientName: value("clientName"), clientPhone: value("clientPhone"), clientIp: value("clientIp"), sector: value("sector"),
      zoneId: value("zoneId"), supportTypeId: value("supportTypeId"), technicianId: value("technicianId"),
      status, priority: value("priority"), intakeDate: value("intakeDate"), scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      completedAt: status === "completed" ? editing?.completedAt ?? new Date().toISOString() : null,
      observation: value("observation"), technicianNotes: value("technicianNotes"), resultNotes: value("resultNotes"),
    };

    try {
      if (editing) {
        const updated = normalize(await updateTicketRequest<TicketItem>(editing.id, body));
        setTickets((current) => current.map((ticket) => ticket.id === editing.id ? updated : ticket));
      } else {
        const created = normalize(await createTicketRequest<TicketItem>(body));
        setTickets((current) => [created, ...current]);
      }
      setIsOpen(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (ticket: TicketItem) => {
    if (!window.confirm(`Eliminar el soporte de ${ticket.clientName}?`)) return;
    setError(null);
    try {
      await deleteTicketRequest(ticket.id);
      setTickets((current) => current.filter((item) => item.id !== ticket.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo eliminar");
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm"><Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-zinc-400" /><span className="sr-only">Buscar soportes</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, IP o tecnico" className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-900" /></label>
        <button type="button" onClick={openCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"><Plus className="size-4" /> Nuevo soporte</button>
      </div>
      {error && !isOpen ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-hidden border-y border-zinc-200 bg-white sm:rounded-md sm:border">
        {visibleTickets.length === 0 ? <p className="px-4 py-12 text-center text-sm text-zinc-500">No hay soportes que mostrar.</p> : visibleTickets.map((ticket) => (
          <div key={ticket.id} className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-zinc-950">{ticket.clientName}</p><span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">{labelOf(statuses, ticket.status)}</span></div>
              <p className="mt-1 truncate text-xs text-zinc-500">{ticket.zone?.name ?? ticket.sector ?? "Sin zona"} · {ticket.supportType?.name ?? "Sin tipo"} · {ticket.technician?.name ?? "Sin asignar"}</p>
            </div>
            <button type="button" onClick={() => openEdit(ticket)} title="Editar" aria-label={`Editar soporte de ${ticket.clientName}`} className="grid size-9 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100"><Pencil className="size-4" /></button>
            <button type="button" onClick={() => remove(ticket)} title="Eliminar" aria-label={`Eliminar soporte de ${ticket.clientName}`} className="grid size-9 place-items-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-0 sm:p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit} className="mx-auto min-h-full w-full bg-white p-5 shadow-xl sm:min-h-0 sm:max-w-2xl sm:rounded-md">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold">{editing ? "Editar soporte" : "Nuevo soporte"}</h3><button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar" className="grid size-9 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Cliente<input name="clientName" defaultValue={editing?.clientName} required autoFocus className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium">Telefono<input name="clientPhone" defaultValue={editing?.clientPhone ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium">IP<input name="clientIp" defaultValue={editing?.clientIp ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium">Sector<input name="sector" defaultValue={editing?.sector ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium">Zona<select name="zoneId" defaultValue={editing?.zoneId ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base"><option value="">Sin zona</option>{catalogs.zones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm font-medium">Tipo de soporte<select name="supportTypeId" defaultValue={editing?.supportTypeId ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base"><option value="">Sin tipo</option>{catalogs.supportTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm font-medium">Tecnico<select name="technicianId" defaultValue={editing?.technicianId ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base"><option value="">Sin asignar</option>{catalogs.technicians.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm font-medium">Estado<select name="status" defaultValue={editing?.status ?? "pending"} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-sm font-medium">Prioridad<select name="priority" defaultValue={editing?.priority ?? "normal"} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">{priorities.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label className="text-sm font-medium">Fecha de ingreso<input name="intakeDate" type="date" defaultValue={editing?.intakeDate.slice(0, 10) ?? today()} required className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium sm:col-span-2">Fecha programada<input name="scheduledAt" type="datetime-local" defaultValue={dateValue(editing?.scheduledAt ?? null)} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium sm:col-span-2">Observacion<textarea name="observation" defaultValue={editing?.observation ?? ""} rows={3} className="mt-1.5 w-full rounded-md border border-zinc-300 p-3 text-base" /></label>
              <label className="text-sm font-medium sm:col-span-2">Notas del tecnico<textarea name="technicianNotes" defaultValue={editing?.technicianNotes ?? ""} rows={2} className="mt-1.5 w-full rounded-md border border-zinc-300 p-3 text-base" /></label>
              <label className="text-sm font-medium sm:col-span-2">Resultado<textarea name="resultNotes" defaultValue={editing?.resultNotes ?? ""} rows={2} className="mt-1.5 w-full rounded-md border border-zinc-300 p-3 text-base" /></label>
            </div>
            {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <div className="sticky bottom-0 mt-6 flex justify-end gap-2 border-t border-zinc-200 bg-white pt-4"><button type="button" onClick={() => setIsOpen(false)} className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cancelar</button><button type="submit" disabled={isSaving} className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">{isSaving ? "Guardando..." : "Guardar"}</button></div>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default TicketManager;
