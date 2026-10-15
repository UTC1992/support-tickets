import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db/prisma";

const ticketStatuses = [
  "pending",
  "assigned",
  "in_progress",
  "completed",
  "not_completed",
  "rescheduled",
  "cancelled",
] as const;

const ticketPriorities = ["low", "normal", "high", "urgent"] as const;

type TicketStatusInput = (typeof ticketStatuses)[number];
type TicketPriorityInput = (typeof ticketPriorities)[number];

type TicketCreateInput = {
  clientName: string;
  clientPhone?: string | null;
  clientIp?: string | null;
  sector?: string | null;
  zoneId?: string | null;
  supportTypeId?: string | null;
  technicianId?: string | null;
  status?: TicketStatusInput;
  priority?: TicketPriorityInput;
  intakeDate?: string;
  scheduledAt?: string | null;
  completedAt?: string | null;
  observation?: string | null;
  technicianNotes?: string | null;
  resultNotes?: string | null;
};

export type TicketFilters = {
  status?: string | null;
  technicianId?: string | null;
  zoneId?: string | null;
  supportTypeId?: string | null;
  search?: string | null;
  from?: string | null;
  to?: string | null;
  limit?: string | null;
  page?: string | null;
};

const ticketInclude = {
  zone: true,
  supportType: true,
  technician: true,
} satisfies Prisma.TicketInclude;

export const listTickets = async (tenantId: string, filters: TicketFilters) => {
  const take = clampLimit(filters.limit);
  const page = clampPage(filters.page);
  const where = buildTicketWhere(tenantId, filters);
  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: [{ intakeDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * take,
      take,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    pagination: {
      page,
      pageSize: take,
      total,
      totalPages: Math.max(1, Math.ceil(total / take)),
    },
  };
};

export const listTechnicianTickets = async (
  tenantId: string,
  technicianId: string,
  filters: TicketFilters,
) => listTickets(tenantId, { ...filters, technicianId });

export const listTicketsForExport = async (tenantId: string, filters: TicketFilters) => {
  return prisma.ticket.findMany({
    where: buildTicketWhere(tenantId, filters),
    include: ticketInclude,
    orderBy: [{ intakeDate: "desc" }, { createdAt: "desc" }],
  });
};

export const getTicket = async (tenantId: string, id: string) => {
  const ticket = await prisma.ticket.findFirst({
    where: { id, tenantId },
    include: {
      ...ticketInclude,
      history: {
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  return ticket;
};

export const createTicket = async (
  tenantId: string,
  actorId: string,
  input: unknown,
) => {
  const payload = readObject(input);
  const data = parseCreateInput(payload);

  return prisma.$transaction(async (tx) => {
    await assertTenantRelations(tx, tenantId, payload);
    const ticket = await tx.ticket.create({
      data: {
        ...data,
        tenantId,
        createdBy: actorId,
        updatedBy: actorId,
      },
      include: ticketInclude,
    });

    await tx.ticketHistory.create({
      data: {
        tenantId,
        ticketId: ticket.id,
        actorId,
        eventType: "created",
        newValue: ticket as unknown as Prisma.InputJsonValue,
      },
    });

    return ticket;
  });
};

export const updateTicket = async (
  tenantId: string,
  actorId: string,
  id: string,
  input: unknown,
) => {
  const payload = readObject(input);
  const data = parseUpdateInput(payload);

  return prisma.$transaction(async (tx) => {
    const previous = await tx.ticket.findFirst({ where: { id, tenantId } });

    if (!previous) {
      throw new Error("Ticket not found");
    }

    await assertTenantRelations(tx, tenantId, payload);
    const ticket = await tx.ticket.update({
      where: { id, tenantId },
      data: { ...data, updatedBy: actorId },
      include: ticketInclude,
    });

    await tx.ticketHistory.create({
      data: {
        tenantId,
        ticketId: ticket.id,
        actorId,
        eventType: "updated",
        oldValue: previous as unknown as Prisma.InputJsonValue,
        newValue: ticket as unknown as Prisma.InputJsonValue,
      },
    });

    return ticket;
  });
};

export const updateTechnicianTicket = async (
  id: string,
  tenantId: string,
  technicianId: string,
  actorId: string,
  input: unknown,
) => {
  const payload = readObject(input);

  return prisma.$transaction(async (tx) => {
    const previous = await tx.ticket.findFirst({
      where: { id, tenantId, technicianId },
    });

    if (!previous) {
      throw new Error("Assigned ticket not found");
    }

    const data = parseTechnicianUpdateInput(payload, previous.status);
    const ticket = await tx.ticket.update({
      where: { id, tenantId, technicianId },
      data: { ...data, updatedBy: actorId },
      include: ticketInclude,
    });

    await tx.ticketHistory.create({
      data: {
        tenantId,
        ticketId: ticket.id,
        actorId,
        eventType: "technician_updated",
        oldValue: previous as unknown as Prisma.InputJsonValue,
        newValue: ticket as unknown as Prisma.InputJsonValue,
      },
    });

    return ticket;
  });
};

export const deleteTicket = async (tenantId: string, id: string) => {
  const ticket = await prisma.ticket.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  await prisma.ticket.delete({ where: { id, tenantId } });
};

const parseCreateInput = (
  input: unknown,
): Omit<Prisma.TicketUncheckedCreateInput, "tenantId"> => {
  const payload = readObject(input);
  const clientName = readRequiredString(payload, "clientName");

  return {
    clientName,
    clientPhone: readOptionalString(payload, "clientPhone"),
    clientIp: readOptionalString(payload, "clientIp"),
    sector: readOptionalString(payload, "sector"),
    zoneId: readOptionalString(payload, "zoneId"),
    supportTypeId: readOptionalString(payload, "supportTypeId"),
    technicianId: readOptionalString(payload, "technicianId"),
    status: parseStatus(readOptionalString(payload, "status") ?? "pending"),
    priority: parsePriority(readOptionalString(payload, "priority") ?? "normal"),
    intakeDate: parseDate(readOptionalString(payload, "intakeDate")),
    scheduledAt: parseOptionalDateTime(payload, "scheduledAt"),
    completedAt: parseOptionalDateTime(payload, "completedAt"),
    observation: readOptionalString(payload, "observation"),
    technicianNotes: readOptionalString(payload, "technicianNotes"),
    resultNotes: readOptionalString(payload, "resultNotes"),
  };
};

const parseUpdateInput = (input: unknown): Prisma.TicketUpdateInput => {
  const payload = readObject(input);
  const data: Prisma.TicketUpdateInput = {};

  if ("clientName" in payload) data.clientName = readRequiredString(payload, "clientName");

  assignNullableString(data, "clientPhone", payload);
  assignNullableString(data, "clientIp", payload);
  assignNullableString(data, "sector", payload);
  assignNullableString(data, "observation", payload);
  assignNullableString(data, "technicianNotes", payload);
  assignNullableString(data, "resultNotes", payload);

  if ("zoneId" in payload) data.zone = connectNullable(payload.zoneId);
  if ("supportTypeId" in payload) data.supportType = connectNullable(payload.supportTypeId);
  if ("technicianId" in payload) data.technician = connectNullable(payload.technicianId);
  if ("status" in payload) data.status = parseStatus(readRequiredString(payload, "status"));
  if ("priority" in payload) data.priority = parsePriority(readRequiredString(payload, "priority"));
  if ("intakeDate" in payload) data.intakeDate = parseDate(readRequiredString(payload, "intakeDate"));
  if ("scheduledAt" in payload) data.scheduledAt = parseOptionalDateTime(payload, "scheduledAt");
  if ("completedAt" in payload) data.completedAt = parseOptionalDateTime(payload, "completedAt");

  return data;
};

const technicianStatusTransitions: Record<TicketStatusInput, TicketStatusInput[]> = {
  pending: ["in_progress", "completed", "not_completed", "rescheduled"],
  assigned: ["in_progress", "completed", "not_completed", "rescheduled"],
  in_progress: ["completed", "not_completed", "rescheduled"],
  completed: [],
  not_completed: ["in_progress", "completed", "rescheduled"],
  rescheduled: ["in_progress", "completed", "not_completed", "rescheduled"],
  cancelled: [],
};

const parseTechnicianUpdateInput = (
  payload: Record<string, unknown>,
  currentStatus: TicketStatusInput,
): Prisma.TicketUpdateInput => {
  const data: Prisma.TicketUpdateInput = {};
  const status = "status" in payload
    ? parseStatus(readRequiredString(payload, "status"))
    : currentStatus;

  if (status !== currentStatus) {
    if (!technicianStatusTransitions[currentStatus].includes(status)) {
      throw new Error(`Invalid technician status transition: ${currentStatus} to ${status}`);
    }

    data.status = status;
  }

  assignNullableString(data, "technicianNotes", payload);
  assignNullableString(data, "resultNotes", payload);

  if (["completed", "not_completed", "rescheduled"].includes(status)) {
    const resultNotes = readRequiredString(payload, "resultNotes");
    data.resultNotes = resultNotes;
  }

  if (status === "completed") {
    data.completedAt = new Date();
  } else if (status !== currentStatus) {
    data.completedAt = null;
  }

  if (status === "rescheduled") {
    const scheduledAt = parseOptionalDateTime(payload, "scheduledAt");

    if (!(scheduledAt instanceof Date)) {
      throw new Error("scheduledAt is required");
    }

    data.scheduledAt = scheduledAt;
  }

  return data;
};

const readObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Request body must be an object");
  }

  return input as Record<string, unknown>;
};

const readRequiredString = (payload: Record<string, unknown>, key: string) => {
  const value = readOptionalString(payload, key);

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
};

const readOptionalString = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];

  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);

  return value.trim();
};

const parseStatus = (value: string) => {
  if (!ticketStatuses.includes(value as TicketStatusInput)) {
    throw new Error(`Invalid ticket status: ${value}`);
  }

  return value as TicketStatusInput;
};

const parsePriority = (value: string) => {
  if (!ticketPriorities.includes(value as TicketPriorityInput)) {
    throw new Error(`Invalid ticket priority: ${value}`);
  }

  return value as TicketPriorityInput;
};

const parseDate = (value?: string | null) => {
  if (!value) return new Date();
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return date;
};

const parseOptionalDateTime = (payload: Record<string, unknown>, key: string) => {
  const rawValue = payload[key];
  if (rawValue === undefined) return undefined;
  if (rawValue === null || rawValue === "") return null;
  if (typeof rawValue !== "string") throw new Error(`${key} must be a valid date`);
  const value = rawValue.trim();
  if (!value) return null;
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} must be a valid date`);
  }

  return date;
};

const connectNullable = (value: unknown) => {
  if (value === null || value === "") return { disconnect: true };
  if (typeof value !== "string") throw new Error("Relation id must be a string or null");
  return { connect: { id: value } };
};

const assignNullableString = (
  data: Prisma.TicketUpdateInput,
  key: keyof Pick<
    TicketCreateInput,
    | "clientPhone"
    | "clientIp"
    | "sector"
    | "observation"
    | "technicianNotes"
    | "resultNotes"
  >,
  payload: Record<string, unknown>,
) => {
  if (key in payload) {
    data[key] = readOptionalString(payload, key) ?? null;
  }
};

const buildTicketWhere = (tenantId: string, filters: TicketFilters) => {
  const where: Prisma.TicketWhereInput = { tenantId };

  if (filters.status) where.status = parseStatus(filters.status);
  if (filters.technicianId) where.technicianId = filters.technicianId;
  if (filters.zoneId) where.zoneId = filters.zoneId;
  if (filters.supportTypeId) where.supportTypeId = filters.supportTypeId;

  if (filters.from || filters.to) {
    where.intakeDate = {
      ...(filters.from ? { gte: parseDate(filters.from) } : {}),
      ...(filters.to ? { lte: parseDate(filters.to) } : {}),
    };
  }

  if (filters.search) {
    const search = filters.search.trim();
    where.OR = [
      { clientName: { contains: search, mode: "insensitive" } },
      { clientPhone: { contains: search, mode: "insensitive" } },
      { clientIp: { contains: search, mode: "insensitive" } },
      { sector: { contains: search, mode: "insensitive" } },
      { observation: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
};

const assertTenantRelations = async (
  tx: Prisma.TransactionClient,
  tenantId: string,
  payload: Record<string, unknown>,
) => {
  const zoneId = readRelationId(payload, "zoneId");
  const supportTypeId = readRelationId(payload, "supportTypeId");
  const technicianId = readRelationId(payload, "technicianId");
  const [zone, supportType, technician] = await Promise.all([
    zoneId ? tx.zone.findFirst({ where: { id: zoneId, tenantId }, select: { id: true } }) : null,
    supportTypeId ? tx.supportType.findFirst({ where: { id: supportTypeId, tenantId }, select: { id: true } }) : null,
    technicianId ? tx.technician.findFirst({ where: { id: technicianId, tenantId }, select: { id: true } }) : null,
  ]);

  if ((zoneId && !zone) || (supportTypeId && !supportType) || (technicianId && !technician)) {
    throw new Error("Related resource not found");
  }
};

const readRelationId = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Relation id must be a string or null");
  return value;
};

const clampLimit = (value?: string | null) => {
  if (!value) return 20;
  const limit = Number.parseInt(value, 10);

  if (Number.isNaN(limit)) return 20;

  return Math.min(Math.max(limit, 1), 100);
};

const clampPage = (value?: string | null) => {
  if (!value) return 1;
  const page = Number.parseInt(value, 10);
  return Number.isNaN(page) ? 1 : Math.max(page, 1);
};
