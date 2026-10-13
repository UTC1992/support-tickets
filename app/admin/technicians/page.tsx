import { Suspense } from "react";
import CatalogManager from "@/features/admin/components/CatalogManager";
import AdminLoading from "@/features/admin/components/AdminLoading";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import { listAdminTechnicians } from "@/features/admin/services/admin-service";

const TechniciansContent = async () => {
  const technicians = await listAdminTechnicians();
  const items = technicians.map((item) => ({ id: item.id, name: item.name, phone: item.phone, isActive: item.isActive, ticketCount: item._count.tickets }));
  return <><AdminPageHeader title="Tecnicos" description="Personal disponible para asignar soportes." /><CatalogManager initialItems={items} resource="technicians" itemLabel="tecnico" secondaryField="phone" /></>;
};

const TechniciansPage = () => <Suspense fallback={<AdminLoading />}><TechniciansContent /></Suspense>;

export default TechniciansPage;
