import { Suspense } from "react";
import PageHeader from "@/features/navigation/components/PageHeader";
import PageLoading from "@/features/navigation/components/PageLoading";
import TicketManager from "@/features/tickets/components/TicketManager";
import { getTicketCatalogs, listManagedTickets } from "@/features/tickets/services/ticket-service";

const TicketsContent = async () => {
  const [tickets, catalogs] = await Promise.all([
    listManagedTickets(),
    getTicketCatalogs(),
  ]);
  const initialTickets = tickets.map((ticket) => ({
    ...ticket,
    intakeDate: ticket.intakeDate.toISOString(),
    scheduledAt: ticket.scheduledAt?.toISOString() ?? null,
    completedAt: ticket.completedAt?.toISOString() ?? null,
  }));

  return (
    <>
      <PageHeader title="Soportes" description="Crea, asigna y actualiza los soportes registrados." />
      <TicketManager initialTickets={initialTickets} catalogs={catalogs} canDelete={false} />
    </>
  );
};

const OfficeTicketsPage = () => (
  <Suspense fallback={<PageLoading />}>
    <TicketsContent />
  </Suspense>
);

export default OfficeTicketsPage;
