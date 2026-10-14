"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import type { TicketItem } from "@/features/tickets/types";

type TechnicianTicketFormProps = {
  error: Error | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: FormData) => void;
  ticket: TicketItem;
};

const getDefaultStatus = (status: string) => status === "rescheduled"
  ? "in_progress"
  : "completed";

const TechnicianTicketForm = ({
  error,
  isSaving,
  onClose,
  onSave,
  ticket,
}: TechnicianTicketFormProps) => {
  const [status, setStatus] = useState(getDefaultStatus(ticket.status));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(new FormData(event.currentTarget));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="technician-ticket-form-title">
      <form onSubmit={handleSubmit} className="mx-auto min-h-full w-full bg-white p-5 shadow-xl sm:min-h-0 sm:max-w-xl sm:rounded-md">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="technician-ticket-form-title" className="text-lg font-semibold">Actualizar soporte</h2>
            <p className="mt-1 break-words text-sm text-zinc-600">{ticket.clientName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar formulario" className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-zinc-100">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium" htmlFor="technician-ticket-status">Estado</label>
          <select
            id="technician-ticket-status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="-mt-3 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base"
          >
            <option value="completed">Completado</option>
            <option value="not_completed">No completado</option>
            <option value="rescheduled">Reprogramado</option>
            {ticket.status === "rescheduled" ? <option value="in_progress">En progreso</option> : null}
          </select>

          {status === "rescheduled" ? (
            <label className="block text-sm font-medium">
              Nueva fecha programada
              <input name="scheduledAt" type="datetime-local" required className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" />
            </label>
          ) : null}

          <label className="block text-sm font-medium">
            Notas tecnicas
            <textarea name="technicianNotes" defaultValue={ticket.technicianNotes ?? ""} rows={3} className="mt-1.5 w-full rounded-md border border-zinc-300 p-3 text-base" />
          </label>

          <label className="block text-sm font-medium">
            Resultado
            <textarea name="resultNotes" defaultValue={ticket.resultNotes ?? ""} required rows={4} className="mt-1.5 w-full rounded-md border border-zinc-300 p-3 text-base" />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}

        <div className="sticky bottom-0 mt-6 flex flex-col-reverse gap-2 border-t border-zinc-200 bg-white pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={isSaving} className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">
            {isSaving ? "Guardando..." : "Guardar resultado"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TechnicianTicketForm;
