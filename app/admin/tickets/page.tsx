import { Suspense } from "react";
import AdminLoading from "@/features/admin/components/AdminLoading";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import TicketManager from "@/features/admin/components/TicketManager";
import { getAdminTicketCatalogs, listAdminTickets } from "@/features/admin/services/admin-service";

const TicketsContent = async () => {
  const [tickets, catalogs] = await Promise.all([listAdminTickets(), getAdminTicketCatalogs()]);
  const initialTickets = tickets.map((ticket) => ({
    ...ticket,
    intakeDate: ticket.intakeDate.toISOString(),
    scheduledAt: ticket.scheduledAt?.toISOString() ?? null,
    completedAt: ticket.completedAt?.toISOString() ?? null,
  }));

  return <><AdminPageHeader title="Soportes" description="Crea, asigna y actualiza los soportes registrados." /><TicketManager initialTickets={initialTickets} catalogs={catalogs} /></>;
};

const TicketsPage = () => <Suspense fallback={<AdminLoading />}><TicketsContent /></Suspense>;

export default TicketsPage;
