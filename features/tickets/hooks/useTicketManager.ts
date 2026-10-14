"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createTicketRequest, deleteTicketRequest, getTicketExportUrl, listTicketsRequest, updateTicketRequest } from "@/features/tickets/services/ticket-api-service";
import type { TicketFilterField, TicketFilterValues, TicketItem, TicketPageData } from "@/features/tickets/types";

const defaultFilters: TicketFilterValues = {
  from: "",
  page: 1,
  pageSize: 20,
  search: "",
  status: "",
  supportTypeId: "",
  technicianId: "",
  to: "",
  zoneId: "",
};

const useTicketManager = (initialData: TicketPageData) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TicketItem | null>(null);
  const [viewing, setViewing] = useState<TicketItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);

  const ticketsQuery = useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => listTicketsRequest(filters),
    initialData: filters === defaultFilters ? initialData : undefined,
    placeholderData: keepPreviousData,
  });

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

  const refreshTickets = () => queryClient.invalidateQueries({ queryKey: ["tickets"] });

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
  const closeDetails = () => setViewing(null);

  const openDetails = (ticket: TicketItem) => setViewing(ticket);

  const editFromDetails = () => {
    if (!viewing) return;
    openEdit(viewing);
    closeDetails();
  };

  const setDraftFilter = (field: TicketFilterField, value: string) => {
    setDraftFilters((current) => ({ ...current, [field]: value }));
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters, page: 1 });
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  };

  const setPage = (page: number) => {
    setFilters((current) => ({ ...current, page }));
  };

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
          onSuccess: () => {
            closeForm();
            void refreshTickets();
          },
        },
      );
      return;
    }

    createMutation.mutate(body, {
      onSuccess: () => {
        closeForm();
        void refreshTickets();
      },
    });
  };

  const deleteTicket = (ticket: TicketItem) => {
    if (!window.confirm(`Eliminar el soporte de ${ticket.clientName}?`)) return;

    resetMutations();
    deleteMutation.mutate(ticket.id, {
      onSuccess: () => {
        void refreshTickets();
      },
    });
  };

  return {
    closeForm,
    closeDetails,
    clearFilters,
    deleteTicket,
    draftFilters,
    editFromDetails,
    editing,
    error: createMutation.error ?? updateMutation.error ?? deleteMutation.error,
    exportUrl: getTicketExportUrl(filters),
    isLoading: ticketsQuery.isFetching,
    isOpen,
    isSaving: createMutation.isPending || updateMutation.isPending,
    openDetails,
    openCreate,
    openEdit,
    pagination: ticketsQuery.data?.pagination ?? initialData.pagination,
    applyFilters,
    saveTicket,
    setDraftFilter,
    setPage,
    tickets: ticketsQuery.data?.tickets ?? initialData.tickets,
    viewing,
  };
};

export default useTicketManager;
