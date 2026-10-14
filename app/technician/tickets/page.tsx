import { Suspense } from "react";
import TechnicianTicketManager from "@/features/tickets/components/TechnicianTicketManager";
import { listAssignedTickets } from "@/features/tickets/services/ticket-service";

const AssignedTicketsContent = async () => {
  const ticketPage = await listAssignedTickets();
  const serializedTickets = ticketPage.tickets.map((ticket) => ({
    ...ticket,
    intakeDate: ticket.intakeDate.toISOString(),
    scheduledAt: ticket.scheduledAt?.toISOString() ?? null,
    completedAt: ticket.completedAt?.toISOString() ?? null,
  }));

  return <TechnicianTicketManager initialData={{
    tickets: serializedTickets,
    pagination: ticketPage.pagination,
  }} />;
};

const TechnicianTicketsPage = () => (
  <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-zinc-100" />}>
    <AssignedTicketsContent />
  </Suspense>
);

export default TechnicianTicketsPage;
