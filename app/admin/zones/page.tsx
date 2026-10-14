import { Suspense } from "react";
import CatalogManager from "@/features/catalogs/components/CatalogManager";
import { listZones } from "@/features/catalogs/services/catalog-service";
import PageHeader from "@/features/navigation/components/PageHeader";
import PageLoading from "@/features/navigation/components/PageLoading";

const ZonesContent = async () => {
  const zones = await listZones();
  const items = zones.map((item) => ({ id: item.id, name: item.name, isActive: item.isActive, ticketCount: item._count.tickets }));
  return <><PageHeader title="Zonas" description="Sectores usados para organizar los soportes." /><CatalogManager initialItems={items} resource="zones" itemLabel="zona" /></>;
};

const ZonesPage = () => <Suspense fallback={<PageLoading />}><ZonesContent /></Suspense>;

export default ZonesPage;
