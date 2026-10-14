"use client";

import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2, X } from "lucide-react";
import { FormEvent } from "react";
import TicketDetails from "@/features/tickets/components/TicketDetails";
import TicketFilters from "@/features/tickets/components/TicketFilters";
import { getOptionLabel, ticketPriorities, ticketStatuses } from "@/features/tickets/constants";
import useTicketManager from "@/features/tickets/hooks/useTicketManager";
import type { TicketCatalogs, TicketPageData } from "@/features/tickets/types";

type TicketManagerProps = {
  initialData: TicketPageData;
  catalogs: TicketCatalogs;
  canDelete?: boolean;
};

const dateValue = (value: string | null) => value ? value.slice(0, 16) : "";
const today = () => new Date().toISOString().slice(0, 10);

const TicketManager = ({ initialData, catalogs, canDelete = true }: TicketManagerProps) => {
  const {
    applyFilters,
    clearFilters,
    closeDetails,
    closeForm,
    deleteTicket,
    draftFilters,
    editFromDetails,
    editing,
    error,
    exportUrl,
    isLoading,
    isOpen,
    isSaving,
    openDetails,
    openCreate,
    openEdit,
    pagination,
    saveTicket,
    setDraftFilter,
    setPage,
    tickets,
    viewing,
  } = useTicketManager(initialData);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveTicket(new FormData(event.currentTarget));
  };

  return (
    <>
      <TicketFilters catalogs={catalogs} filters={draftFilters} exportUrl={exportUrl} isLoading={isLoading} onApply={applyFilters} onChange={setDraftFilter} onClear={clearFilters} onCreate={openCreate} />
      {error && !isOpen ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
      <div className="mb-2 flex min-h-6 items-center justify-between gap-3 text-xs text-zinc-500">
        <span>{pagination.total} soportes</span>
        {isLoading ? <span>Actualizando...</span> : null}
      </div>
      <div className="overflow-hidden border-y border-zinc-200 bg-white sm:rounded-md sm:border">
        {tickets.length === 0 ? <p className="px-4 py-12 text-center text-sm text-zinc-500">No hay soportes que mostrar.</p> : tickets.map((ticket) => (
          <div key={ticket.id} className="flex items-center gap-1 border-b border-zinc-200 px-3 py-3 last:border-0 sm:gap-2 sm:px-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-zinc-950">{ticket.clientName}</p><span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">{getOptionLabel(ticketStatuses, ticket.status)}</span></div>
              <p className="mt-1 truncate text-xs text-zinc-500">{ticket.zone?.name ?? ticket.sector ?? "Sin zona"} · {ticket.supportType?.name ?? "Sin tipo"} · {ticket.technician?.name ?? "Sin asignar"}</p>
            </div>
            <button type="button" onClick={() => openDetails(ticket)} title="Ver detalle" aria-label={`Ver soporte de ${ticket.clientName}`} className="grid size-11 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100"><Eye className="size-4" /></button>
            <button type="button" onClick={() => openEdit(ticket)} title="Editar" aria-label={`Editar soporte de ${ticket.clientName}`} className="grid size-11 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100"><Pencil className="size-4" /></button>
            {canDelete ? <button type="button" onClick={() => deleteTicket(ticket)} title="Eliminar" aria-label={`Eliminar soporte de ${ticket.clientName}`} className="grid size-11 place-items-center rounded-md text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button> : null}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setPage(pagination.page - 1)} disabled={pagination.page <= 1 || isLoading} aria-label="Pagina anterior" className="grid size-11 place-items-center rounded-md border border-zinc-300 bg-white disabled:opacity-40"><ChevronLeft className="size-5" /></button>
        <p className="text-sm text-zinc-600">Pagina {pagination.page} de {pagination.totalPages}</p>
        <button type="button" onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages || isLoading} aria-label="Pagina siguiente" className="grid size-11 place-items-center rounded-md border border-zinc-300 bg-white disabled:opacity-40"><ChevronRight className="size-5" /></button>
      </div>

      {viewing ? <TicketDetails ticket={viewing} onClose={closeDetails} onEdit={editFromDetails} /> : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-0 sm:p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit} className="mx-auto min-h-full w-full bg-white p-5 shadow-xl sm:min-h-0 sm:max-w-2xl sm:rounded-md">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold">{editing ? "Editar soporte" : "Nuevo soporte"}</h3><button type="button" onClick={closeForm} aria-label="Cerrar" className="grid size-11 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Cliente<input name="clientName" defaultValue={editing?.clientName} required autoFocus className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium">Telefono<input name="clientPhone" defaultValue={editing?.clientPhone ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium">IP<input name="clientIp" defaultValue={editing?.clientIp ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium">Sector<input name="sector" defaultValue={editing?.sector ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium">Zona<select name="zoneId" defaultValue={editing?.zoneId ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base"><option value="">Sin zona</option>{catalogs.zones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm font-medium">Tipo de soporte<select name="supportTypeId" defaultValue={editing?.supportTypeId ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base"><option value="">Sin tipo</option>{catalogs.supportTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm font-medium">Tecnico<select name="technicianId" defaultValue={editing?.technicianId ?? ""} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base"><option value="">Sin asignar</option>{catalogs.technicians.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm font-medium">Estado<select name="status" defaultValue={editing?.status ?? "pending"} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">{ticketStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label className="text-sm font-medium">Prioridad<select name="priority" defaultValue={editing?.priority ?? "normal"} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">{ticketPriorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}</select></label>
              <label className="text-sm font-medium">Fecha de ingreso<input name="intakeDate" type="date" defaultValue={editing?.intakeDate.slice(0, 10) ?? today()} required className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium sm:col-span-2">Fecha programada<input name="scheduledAt" type="datetime-local" defaultValue={dateValue(editing?.scheduledAt ?? null)} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" /></label>
              <label className="text-sm font-medium sm:col-span-2">Observacion<textarea name="observation" defaultValue={editing?.observation ?? ""} rows={3} className="mt-1.5 w-full rounded-md border border-zinc-300 p-3 text-base" /></label>
              <label className="text-sm font-medium sm:col-span-2">Notas del tecnico<textarea name="technicianNotes" defaultValue={editing?.technicianNotes ?? ""} rows={2} className="mt-1.5 w-full rounded-md border border-zinc-300 p-3 text-base" /></label>
              <label className="text-sm font-medium sm:col-span-2">Resultado<textarea name="resultNotes" defaultValue={editing?.resultNotes ?? ""} rows={2} className="mt-1.5 w-full rounded-md border border-zinc-300 p-3 text-base" /></label>
            </div>
            {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
            <div className="sticky bottom-0 mt-6 flex flex-col-reverse gap-2 border-t border-zinc-200 bg-white pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeForm} className="h-11 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cancelar</button><button type="submit" disabled={isSaving} className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">{isSaving ? "Guardando..." : "Guardar"}</button></div>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default TicketManager;
