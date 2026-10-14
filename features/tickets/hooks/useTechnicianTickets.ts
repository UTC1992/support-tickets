"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import {
  listTechnicianTicketsRequest,
  updateTechnicianTicketRequest,
} from "@/features/tickets/services/technician-ticket-api-service";
import type {
  TechnicianTicketFilterValues,
  TicketItem,
  TicketPageData,
} from "@/features/tickets/types";

const defaultFilters: TechnicianTicketFilterValues = {
  page: 1,
  pageSize: 20,
  search: "",
  status: "",
};

const replaceTicket = (
  page: TicketPageData | undefined,
  ticket: TicketItem,
) => page
  ? {
      ...page,
      tickets: page.tickets.map((item) => item.id === ticket.id ? ticket : item),
    }
  : page;

const useTechnicianTickets = (initialData: TicketPageData) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<TicketItem | null>(null);
  const [viewing, setViewing] = useState<TicketItem | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["technician-tickets", filters],
    queryFn: () => listTechnicianTicketsRequest(filters),
    initialData: filters === defaultFilters ? initialData : undefined,
    placeholderData: keepPreviousData,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: {
      id: string;
      body: Parameters<typeof updateTechnicianTicketRequest>[1];
    }) => updateTechnicianTicketRequest(id, body),
    onSuccess: (ticket) => {
      queryClient.setQueriesData<TicketPageData>(
        { queryKey: ["technician-tickets"] },
        (page) => replaceTicket(page, ticket),
      );
      setEditing(null);
      setViewing((current) => current?.id === ticket.id ? ticket : current);
      void queryClient.invalidateQueries({ queryKey: ["technician-tickets"] });
    },
  });

  const applyFilters = () => {
    setFilters((current) => ({ ...current, page: 1, search, status }));
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setFilters(defaultFilters);
  };

  const setPage = (page: number) => {
    setFilters((current) => ({ ...current, page }));
  };

  const startTicket = (ticket: TicketItem) => {
    updateMutation.reset();
    updateMutation.mutate({ id: ticket.id, body: { status: "in_progress" } });
  };

  const saveResolution = (data: FormData) => {
    if (!editing) return;
    const statusValue = String(data.get("status") ?? "");
    const scheduledAt = String(data.get("scheduledAt") ?? "");

    updateMutation.reset();
    updateMutation.mutate({
      id: editing.id,
      body: {
        status: statusValue,
        technicianNotes: String(data.get("technicianNotes") ?? ""),
        resultNotes: String(data.get("resultNotes") ?? ""),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      },
    });
  };

  return {
    applyFilters,
    clearFilters,
    closeDetails: () => setViewing(null),
    closeForm: () => setEditing(null),
    editing,
    error: updateMutation.error ?? ticketsQuery.error,
    isLoading: ticketsQuery.isFetching,
    isSaving: updateMutation.isPending,
    openDetails: setViewing,
    openForm: setEditing,
    pagination: ticketsQuery.data?.pagination ?? initialData.pagination,
    saveResolution,
    search,
    setPage,
    setSearch,
    setStatus,
    startTicket,
    status,
    tickets: ticketsQuery.data?.tickets ?? initialData.tickets,
    viewing,
  };
};

export default useTechnicianTickets;
