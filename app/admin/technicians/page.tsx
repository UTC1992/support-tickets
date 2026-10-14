import { Suspense } from "react";
import CatalogManager from "@/features/catalogs/components/CatalogManager";
import { listTechnicians } from "@/features/catalogs/services/catalog-service";
import PageHeader from "@/features/navigation/components/PageHeader";
import PageLoading from "@/features/navigation/components/PageLoading";

const TechniciansContent = async () => {
  const technicians = await listTechnicians();
  const items = technicians.map((item) => ({ id: item.id, name: item.name, phone: item.phone, isActive: item.isActive, ticketCount: item._count.tickets }));
  return <><PageHeader title="Técnicos" description="Personal disponible para asignar soportes." /><CatalogManager initialItems={items} resource="technicians" itemLabel="técnico" secondaryField="phone" /></>;
};

const TechniciansPage = () => <Suspense fallback={<PageLoading />}><TechniciansContent /></Suspense>;

export default TechniciansPage;
