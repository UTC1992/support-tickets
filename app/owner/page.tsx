import { Suspense } from "react";
import DashboardSummary from "@/features/dashboard/components/DashboardSummary";
import getDashboardSummary from "@/features/dashboard/services/dashboard-service";
import PageLoading from "@/features/navigation/components/PageLoading";

const OwnerDashboardContent = async () => {
  const summary = await getDashboardSummary();
  return <DashboardSummary summary={summary} description="Resumen de los soportes de la empresa." />;
};

const OwnerPage = () => (
  <Suspense fallback={<PageLoading />}>
    <OwnerDashboardContent />
  </Suspense>
);

export default OwnerPage;
