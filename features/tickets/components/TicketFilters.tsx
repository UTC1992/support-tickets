"use client";

import { Download, Plus, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { FormEvent } from "react";
import { ticketStatuses } from "@/features/tickets/constants";
import type { TicketCatalogs, TicketFilterField, TicketFilterValues } from "@/features/tickets/types";

type TicketFiltersProps = {
  catalogs: TicketCatalogs;
  filters: TicketFilterValues;
  exportUrl: string;
  isLoading: boolean;
  onApply: () => void;
  onChange: (field: TicketFilterField, value: string) => void;
  onClear: () => void;
  onCreate: () => void;
};

const TicketFilters = ({
  catalogs,
  filters,
  exportUrl,
  isLoading,
  onApply,
  onChange,
  onClear,
  onCreate,
}: TicketFiltersProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative block min-w-0 flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-zinc-400" />
          <span className="sr-only">Buscar soportes</span>
          <input
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
            placeholder="Cliente, teléfono, IP o dirección"
            className="h-11 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-base outline-none focus:border-zinc-900"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <a href={exportUrl} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50">
            <Download aria-hidden="true" className="size-4" /> Excel
          </a>
          <button type="button" onClick={onCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-700">
            <Plus aria-hidden="true" className="size-4" /> Nuevo
          </button>
        </div>
      </div>

      <details className="border-y border-zinc-200 bg-white sm:rounded-md sm:border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-medium text-zinc-800">
          <SlidersHorizontal aria-hidden="true" className="size-4" /> Filtros avanzados
        </summary>
        <div className="grid gap-3 border-t border-zinc-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium">Estado
            <select value={filters.status} onChange={(event) => onChange("status", event.target.value)} className="mt-1 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">
              <option value="">Todos</option>
              {ticketStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Técnico
            <select value={filters.technicianId} onChange={(event) => onChange("technicianId", event.target.value)} className="mt-1 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">
              <option value="">Todos</option>
              {catalogs.technicians.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Sector
            <select value={filters.sectorId} onChange={(event) => onChange("sectorId", event.target.value)} className="mt-1 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">
              <option value="">Todos</option>
              {catalogs.sectors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Tipo de soporte
            <select value={filters.supportTypeId} onChange={(event) => onChange("supportTypeId", event.target.value)} className="mt-1 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base">
              <option value="">Todos</option>
              {catalogs.supportTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Desde
            <input type="date" value={filters.from} onChange={(event) => onChange("from", event.target.value)} className="mt-1 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" />
          </label>
          <label className="text-sm font-medium">Hasta
            <input type="date" value={filters.to} onChange={(event) => onChange("to", event.target.value)} className="mt-1 h-11 w-full rounded-md border border-zinc-300 px-3 text-base" />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end lg:col-span-3">
            <button type="button" onClick={onClear} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-50">
              <RotateCcw aria-hidden="true" className="size-4" /> Limpiar
            </button>
            <button type="submit" disabled={isLoading} className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">
              {isLoading ? "Consultando..." : "Aplicar filtros"}
            </button>
          </div>
        </div>
      </details>
    </form>
  );
};

export default TicketFilters;
