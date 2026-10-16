"use client";

import { Pencil, X } from "lucide-react";
import { getOptionLabel, ticketPriorities, ticketStatuses } from "@/features/tickets/constants";
import type { TicketItem } from "@/features/tickets/types";

type TicketDetailsProps = {
  ticket: TicketItem;
  onClose: () => void;
  onEdit?: () => void;
  editLabel?: string;
};

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Sin registrar";

const formatIntakeDate = (value: string) => new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeZone: "UTC",
}).format(new Date(value));

const Detail = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="min-w-0 border-b border-zinc-100 pb-2">
    <dt className="text-xs font-medium uppercase text-zinc-500">{label}</dt>
    <dd className="mt-1 break-words text-sm text-zinc-900">{value || "Sin registrar"}</dd>
  </div>
);

const TicketDetails = ({
  ticket,
  onClose,
  onEdit,
  editLabel = "Editar",
}: TicketDetailsProps) => (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="ticket-details-title">
    <section className="mx-auto min-h-full w-full bg-white p-5 shadow-xl sm:min-h-0 sm:max-w-2xl sm:rounded-md">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="ticket-details-title" className="break-words text-lg font-semibold">{ticket.clientName}</h3>
          <p className="mt-1 text-sm text-zinc-500">Detalle completo del soporte</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <Detail label="Teléfono" value={ticket.clientPhone} />
        <Detail label="IP" value={ticket.clientIp} />
        <Detail label="Dirección" value={ticket.address} />
        <Detail label="Sector" value={ticket.sector?.name} />
        <Detail label="Tipo de soporte" value={ticket.supportType?.name} />
        <Detail label="Técnico" value={ticket.technician?.name ?? "Sin asignar"} />
        <Detail label="Estado" value={getOptionLabel(ticketStatuses, ticket.status)} />
        <Detail label="Prioridad" value={getOptionLabel(ticketPriorities, ticket.priority)} />
        <Detail label="Fecha de ingreso" value={formatIntakeDate(ticket.intakeDate)} />
        <Detail label="Fecha programada" value={formatDate(ticket.scheduledAt)} />
        <Detail label="Fecha de finalización" value={formatDate(ticket.completedAt)} />
      </dl>

      <div className="mt-4 space-y-4">
        <Detail label="Observación" value={ticket.observation} />
        <Detail label="Notas del técnico" value={ticket.technicianNotes} />
        <Detail label="Resultado" value={ticket.resultNotes} />
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-col-reverse gap-2 border-t border-zinc-200 bg-white pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="h-11 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cerrar</button>
        {onEdit ? <button type="button" onClick={onEdit} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white"><Pencil className="size-4" /> {editLabel}</button> : null}
      </div>
    </section>
  </div>
);

export default TicketDetails;
