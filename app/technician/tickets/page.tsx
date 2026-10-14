import { Suspense } from "react";
import AssignedTicketList from "@/features/tickets/components/AssignedTicketList";
import { listAssignedTickets } from "@/features/tickets/services/ticket-service";

const AssignedTicketsContent = async () => {
  const tickets = await listAssignedTickets();
  const serializedTickets = tickets.map((ticket) => ({
    ...ticket,
    intakeDate: ticket.intakeDate.toISOString().slice(0, 10),
    scheduledAt: ticket.scheduledAt?.toISOString() ?? null,
  }));

  return <AssignedTicketList tickets={serializedTickets} />;
};

const TechnicianTicketsPage = () => (
  <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-zinc-100" />}>
    <AssignedTicketsContent />
  </Suspense>
);

export default TechnicianTicketsPage;
