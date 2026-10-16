import CatalogManager from "@/features/catalogs/components/CatalogManager";
import PageHeader from "@/features/navigation/components/PageHeader";
import { listSectors } from "@/features/catalogs/services/catalog-service";

const SectorsPage = async () => {
  const sectors = await listSectors();
  const items = sectors.map((item) => ({ id: item.id, name: item.name, isActive: item.isActive, ticketCount: item._count.tickets }));
  return <><PageHeader title="Sectores" description="Sectores usados para organizar los soportes." /><CatalogManager initialItems={items} resource="sectors" itemLabel="sector" /></>;
};

export default SectorsPage;
