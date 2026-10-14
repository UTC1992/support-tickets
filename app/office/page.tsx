import { Suspense } from "react";
import DashboardSummary from "@/features/dashboard/components/DashboardSummary";
import getDashboardSummary from "@/features/dashboard/services/dashboard-service";
import PageLoading from "@/features/navigation/components/PageLoading";

const DashboardContent = async () => {
  const summary = await getDashboardSummary();
  return <DashboardSummary summary={summary} ticketsHref="/office/tickets" description="Estado operativo de los soportes." />;
};

const OfficePage = () => (
  <Suspense fallback={<PageLoading />}>
    <DashboardContent />
  </Suspense>
);

export default OfficePage;
