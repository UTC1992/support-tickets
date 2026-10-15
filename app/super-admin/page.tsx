import { Suspense } from "react";
import { connection } from "next/server";
import PageHeader from "@/features/navigation/components/PageHeader";
import PageLoading from "@/features/navigation/components/PageLoading";
import TenantManager from "@/features/tenants/components/TenantManager";
import { listTenants } from "@/features/tenants/services/tenant-service";

const TenantContent = async () => {
  await connection();
  const tenants = await listTenants();
  const initialTenants = tenants.map((tenant) => ({
    ...tenant,
    createdAt: tenant.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader title="Empresas" description="Empresas habilitadas para utilizar la plataforma." />
      <TenantManager initialTenants={initialTenants} />
    </>
  );
};

const SuperAdminPage = () => (
  <Suspense fallback={<PageLoading />}>
    <TenantContent />
  </Suspense>
);

export default SuperAdminPage;
