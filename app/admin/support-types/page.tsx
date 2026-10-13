import { Suspense } from "react";
import CatalogManager from "@/features/admin/components/CatalogManager";
import AdminLoading from "@/features/admin/components/AdminLoading";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import { listAdminSupportTypes } from "@/features/admin/services/admin-service";

const SupportTypesContent = async () => {
  const supportTypes = await listAdminSupportTypes();
  const items = supportTypes.map((item) => ({ id: item.id, name: item.name, exportGroup: item.exportGroup, isActive: item.isActive, ticketCount: item._count.tickets }));
  return <><AdminPageHeader title="Tipos de soporte" description="Categorias usadas para clasificar y exportar soportes." /><CatalogManager initialItems={items} resource="support-types" itemLabel="tipo" secondaryField="exportGroup" /></>;
};

const SupportTypesPage = () => <Suspense fallback={<AdminLoading />}><SupportTypesContent /></Suspense>;

export default SupportTypesPage;
