"use client";

import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Network,
  Phone,
  Play,
  RotateCcw,
  Search,
  Wrench,
} from "lucide-react";
import { FormEvent } from "react";
import TicketDetails from "@/features/tickets/components/TicketDetails";
import TechnicianTicketForm from "@/features/tickets/components/TechnicianTicketForm";
import {
  getOptionLabel,
  ticketPriorities,
  ticketStatuses,
} from "@/features/tickets/constants";
import useTechnicianTickets from "@/features/tickets/hooks/useTechnicianTickets";
import type { TicketItem, TicketPageData } from "@/features/tickets/types";

type TechnicianTicketManagerProps = {
  initialData: TicketPageData;
};

const formatDate = (value: string) => new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: value.includes("T") ? "short" : undefined,
  ...(value.includes("T") ? {} : { timeZone: "UTC" }),
}).format(new Date(value));

const canStart = (ticket: TicketItem) => [
  "pending",
  "assigned",
  "not_completed",
  "rescheduled",
].includes(ticket.status);

const canResolve = (ticket: TicketItem) => ![
  "completed",
  "cancelled",
].includes(ticket.status);

const TechnicianTicketManager = ({ initialData }: TechnicianTicketManagerProps) => {
  const {
    applyFilters,
    clearFilters,
    closeDetails,
    closeForm,
    editing,
    error,
    isLoading,
    isSaving,
    openDetails,
    openForm,
    pagination,
    saveResolution,
    search,
    setPage,
    setSearch,
    setStatus,
    startTicket,
    status,
    tickets,
    viewing,
  } = useTechnicianTickets(initialData);

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const editFromDetails = () => {
    if (!viewing) return;
    openForm(viewing);
    closeDetails();
  };

  return (
    <>
      <form onSubmit={handleFilter} className="mb-4 space-y-2">
        <label className="relative block">
          <Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-zinc-400" />
          <span className="sr-only">Buscar soportes</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cliente, telefono, IP o sector" className="h-11 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-base" />
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <label>
            <span className="sr-only">Filtrar por estado</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">
              <option value="">Todos los estados</option>
              {ticketStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <button type="submit" disabled={isLoading} className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
        </div>
        {(search || status) ? <button type="button" onClick={clearFilters} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-600"><RotateCcw aria-hidden="true" className="size-4" /> Limpiar filtros</button> : null}
      </form>

      {error && !editing ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}

      <div className="mb-2 flex min-h-6 items-center justify-between gap-3 text-xs text-zinc-500">
        <span>{pagination.total} soportes asignados</span>
        {isLoading ? <span>Actualizando...</span> : null}
      </div>

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">No tienes soportes que coincidan con la busqueda.</p>
        ) : tickets.map((ticket) => (
          <article key={ticket.id} className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-base font-semibold text-zinc-950">{ticket.clientName}</h2>
                <p className="mt-0.5 text-sm text-zinc-600">{ticket.supportType?.name ?? "Soporte sin clasificar"}</p>
              </div>
              <span className="shrink-0 rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{getOptionLabel(ticketStatuses, ticket.status)}</span>
            </div>

            <dl className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              <div className="flex items-center gap-2"><MapPin aria-hidden="true" className="size-4 shrink-0 text-zinc-400" /><span>{ticket.zone?.name ?? ticket.sector ?? "Sin ubicacion"}</span></div>
              {ticket.clientPhone ? <div className="flex items-center gap-2"><Phone aria-hidden="true" className="size-4 shrink-0 text-zinc-400" /><a href={`tel:${ticket.clientPhone}`} aria-label={`Llamar a ${ticket.clientName}`} className="font-medium text-emerald-700">{ticket.clientPhone}</a></div> : null}
              {ticket.clientIp ? <div className="flex items-center gap-2"><Network aria-hidden="true" className="size-4 shrink-0 text-zinc-400" /><span>{ticket.clientIp}</span></div> : null}
              <div className="flex items-center gap-2"><CalendarClock aria-hidden="true" className="size-4 shrink-0 text-zinc-400" /><span>{formatDate(ticket.scheduledAt ?? ticket.intakeDate)}</span></div>
            </dl>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-800">Prioridad: {getOptionLabel(ticketPriorities, ticket.priority)}</span>
            </div>

            {ticket.observation ? <div className="mt-4 border-t border-zinc-100 pt-3"><p className="text-xs font-medium uppercase text-zinc-500">Observacion</p><p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{ticket.observation}</p></div> : null}

            <div className="mt-4 grid gap-2 border-t border-zinc-100 pt-3 sm:flex sm:justify-end">
              <button type="button" onClick={() => openDetails(ticket)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-700"><Eye aria-hidden="true" className="size-4" /> Ver detalle</button>
              {canStart(ticket) ? <button type="button" onClick={() => startTicket(ticket)} disabled={isSaving} aria-label={`Iniciar atencion de ${ticket.clientName}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-emerald-700 px-3 text-sm font-medium text-emerald-800 disabled:opacity-50"><Play aria-hidden="true" className="size-4" /> Iniciar atencion</button> : null}
              {canResolve(ticket) ? <button type="button" onClick={() => openForm(ticket)} aria-label={`Registrar resultado de ${ticket.clientName}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white"><Wrench aria-hidden="true" className="size-4" /> Registrar resultado</button> : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setPage(pagination.page - 1)} disabled={pagination.page <= 1 || isLoading} aria-label="Pagina anterior" className="grid size-11 place-items-center rounded-md border border-zinc-300 bg-white disabled:opacity-40"><ChevronLeft className="size-5" /></button>
        <p className="text-sm text-zinc-600">Pagina {pagination.page} de {pagination.totalPages}</p>
        <button type="button" onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages || isLoading} aria-label="Pagina siguiente" className="grid size-11 place-items-center rounded-md border border-zinc-300 bg-white disabled:opacity-40"><ChevronRight className="size-5" /></button>
      </div>

      {viewing ? <TicketDetails ticket={viewing} onClose={closeDetails} onEdit={canResolve(viewing) ? editFromDetails : undefined} editLabel="Registrar resultado" /> : null}
      {editing ? <TechnicianTicketForm key={editing.id} ticket={editing} error={error} isSaving={isSaving} onClose={closeForm} onSave={saveResolution} /> : null}
    </>
  );
};

export default TechnicianTicketManager;
