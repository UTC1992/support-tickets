import { Suspense } from "react";
import CatalogManager from "@/features/catalogs/components/CatalogManager";
import { listSupportTypes } from "@/features/catalogs/services/catalog-service";
import PageHeader from "@/features/navigation/components/PageHeader";
import PageLoading from "@/features/navigation/components/PageLoading";

const SupportTypesContent = async () => {
  const supportTypes = await listSupportTypes();
  const items = supportTypes.map((item) => ({ id: item.id, name: item.name, exportGroup: item.exportGroup, isActive: item.isActive, ticketCount: item._count.tickets }));
  return <><PageHeader title="Tipos de soporte" description="Categorias usadas para clasificar y exportar soportes." /><CatalogManager initialItems={items} resource="support-types" itemLabel="tipo" secondaryField="exportGroup" /></>;
};

const SupportTypesPage = () => <Suspense fallback={<PageLoading />}><SupportTypesContent /></Suspense>;

export default SupportTypesPage;
