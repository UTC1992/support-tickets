export const ticketStatuses = [
  { label: "Pendiente", value: "pending" },
  { label: "Asignado", value: "assigned" },
  { label: "En progreso", value: "in_progress" },
  { label: "Completado", value: "completed" },
  { label: "No completado", value: "not_completed" },
  { label: "Reprogramado", value: "rescheduled" },
  { label: "Cancelado", value: "cancelled" },
];

export const ticketPriorities = [
  { label: "Baja", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "Alta", value: "high" },
  { label: "Urgente", value: "urgent" },
];

export const getOptionLabel = (
  options: Array<{ label: string; value: string }>,
  value: string,
) => options.find((option) => option.value === value)?.label ?? value;
