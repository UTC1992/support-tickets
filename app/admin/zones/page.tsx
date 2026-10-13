import { Suspense } from "react";
import CatalogManager from "@/features/admin/components/CatalogManager";
import AdminLoading from "@/features/admin/components/AdminLoading";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import { listAdminZones } from "@/features/admin/services/admin-service";

const ZonesContent = async () => {
  const zones = await listAdminZones();
  const items = zones.map((item) => ({ id: item.id, name: item.name, isActive: item.isActive, ticketCount: item._count.tickets }));
  return <><AdminPageHeader title="Zonas" description="Sectores usados para organizar los soportes." /><CatalogManager initialItems={items} resource="zones" itemLabel="zona" /></>;
};

const ZonesPage = () => <Suspense fallback={<AdminLoading />}><ZonesContent /></Suspense>;

export default ZonesPage;
