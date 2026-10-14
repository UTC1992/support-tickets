"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { createTicketRequest, deleteTicketRequest, updateTicketRequest } from "@/features/tickets/services/ticket-api-service";
import type { TicketItem } from "@/features/tickets/types";

const normalizeTicket = (ticket: TicketItem) => ({
  ...ticket,
  intakeDate: String(ticket.intakeDate),
  scheduledAt: ticket.scheduledAt ? String(ticket.scheduledAt) : null,
  completedAt: ticket.completedAt ? String(ticket.completedAt) : null,
});

const useTicketManager = (initialTickets: TicketItem[]) => {
  const [tickets, setTickets] = useState(initialTickets);
  const [editing, setEditing] = useState<TicketItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => createTicketRequest<TicketItem>(body),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      updateTicketRequest<TicketItem>(id, body),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTicketRequest,
  });

  const visibleTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tickets;
    return tickets.filter((ticket) => [
      ticket.clientName,
      ticket.clientPhone,
      ticket.clientIp,
      ticket.sector,
      ticket.technician?.name,
    ].some((value) => value?.toLowerCase().includes(term)));
  }, [search, tickets]);

  const resetMutations = () => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
  };

  const openCreate = () => {
    setEditing(null);
    resetMutations();
    setIsOpen(true);
  };

  const openEdit = (ticket: TicketItem) => {
    setEditing(ticket);
    resetMutations();
    setIsOpen(true);
  };

  const closeForm = () => setIsOpen(false);

  const saveTicket = (data: FormData) => {
    const value = (key: string) => String(data.get(key) ?? "");
    const status = value("status");
    const scheduledAt = value("scheduledAt");
    const body = {
      clientName: value("clientName"),
      clientPhone: value("clientPhone"),
      clientIp: value("clientIp"),
      sector: value("sector"),
      zoneId: value("zoneId"),
      supportTypeId: value("supportTypeId"),
      technicianId: value("technicianId"),
      status,
      priority: value("priority"),
      intakeDate: value("intakeDate"),
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      completedAt: status === "completed" ? editing?.completedAt ?? new Date().toISOString() : null,
      observation: value("observation"),
      technicianNotes: value("technicianNotes"),
      resultNotes: value("resultNotes"),
    };

    resetMutations();
    if (editing) {
      updateMutation.mutate(
        { id: editing.id, body },
        {
          onSuccess: (updated) => {
            const normalized = normalizeTicket(updated);
            setTickets((current) => current.map((ticket) => ticket.id === editing.id ? normalized : ticket));
            closeForm();
          },
        },
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: (created) => {
        setTickets((current) => [normalizeTicket(created), ...current]);
        closeForm();
      },
    });
  };

  const deleteTicket = (ticket: TicketItem) => {
    if (!window.confirm(`Eliminar el soporte de ${ticket.clientName}?`)) return;

    resetMutations();
    deleteMutation.mutate(ticket.id, {
      onSuccess: () => {
        setTickets((current) => current.filter((item) => item.id !== ticket.id));
      },
    });
  };

  return {
    closeForm,
    deleteTicket,
    editing,
    error: createMutation.error ?? updateMutation.error ?? deleteMutation.error,
    isOpen,
    isSaving: createMutation.isPending || updateMutation.isPending,
    openCreate,
    openEdit,
    saveTicket,
    search,
    setSearch,
    visibleTickets,
  };
};

export default useTicketManager;
