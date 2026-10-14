import { CalendarClock, MapPin, Network, Phone } from "lucide-react";

type AssignedTicket = {
  id: string;
  clientName: string;
  clientPhone: string | null;
  clientIp: string | null;
  sector: string | null;
  status: string;
  priority: string;
  intakeDate: string;
  scheduledAt: string | null;
  observation: string | null;
  technicianNotes: string | null;
  zone: { name: string } | null;
  supportType: { name: string } | null;
};

type AssignedTicketListProps = { tickets: AssignedTicket[] };

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignado",
  in_progress: "En progreso",
  completed: "Completado",
  not_completed: "No completado",
  rescheduled: "Reprogramado",
  cancelled: "Cancelado",
};

const priorityLabels: Record<string, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

const formatDate = (value: string) => new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: value.includes("T") ? "short" : undefined,
}).format(new Date(value));

const AssignedTicketList = ({ tickets }: AssignedTicketListProps) => {
  if (tickets.length === 0) {
    return <p className="rounded-md border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">No tienes soportes asignados.</p>;
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="rounded-md border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-words text-base font-semibold text-zinc-950">{ticket.clientName}</h2>
              <p className="mt-0.5 text-sm text-zinc-600">{ticket.supportType?.name ?? "Soporte sin clasificar"}</p>
            </div>
            <span className="shrink-0 rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{statusLabels[ticket.status] ?? ticket.status}</span>
          </div>

          <dl className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <div className="flex items-center gap-2"><MapPin aria-hidden="true" className="size-4 shrink-0 text-zinc-400" /><span>{ticket.zone?.name ?? ticket.sector ?? "Sin ubicacion"}</span></div>
            {ticket.clientPhone ? <div className="flex items-center gap-2"><Phone aria-hidden="true" className="size-4 shrink-0 text-zinc-400" /><a href={`tel:${ticket.clientPhone}`} className="font-medium text-emerald-700">{ticket.clientPhone}</a></div> : null}
            {ticket.clientIp ? <div className="flex items-center gap-2"><Network aria-hidden="true" className="size-4 shrink-0 text-zinc-400" /><span>{ticket.clientIp}</span></div> : null}
            <div className="flex items-center gap-2"><CalendarClock aria-hidden="true" className="size-4 shrink-0 text-zinc-400" /><span>{ticket.scheduledAt ? formatDate(ticket.scheduledAt) : formatDate(ticket.intakeDate)}</span></div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-800">Prioridad: {priorityLabels[ticket.priority] ?? ticket.priority}</span>
          </div>

          {ticket.observation ? <div className="mt-4 border-t border-zinc-100 pt-3"><p className="text-xs font-medium uppercase text-zinc-500">Observacion</p><p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{ticket.observation}</p></div> : null}
          {ticket.technicianNotes ? <div className="mt-3"><p className="text-xs font-medium uppercase text-zinc-500">Notas</p><p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{ticket.technicianNotes}</p></div> : null}
        </article>
      ))}
    </div>
  );
};

export default AssignedTicketList;
