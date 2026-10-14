import { Suspense } from "react";
import DashboardSummary from "@/features/dashboard/components/DashboardSummary";
import getDashboardSummary from "@/features/dashboard/services/dashboard-service";
import PageLoading from "@/features/navigation/components/PageLoading";

const DashboardContent = async () => {
  const summary = await getDashboardSummary();
  return <DashboardSummary summary={summary} ticketsHref="/admin/tickets" description="Estado general de la gestión de soportes." />;
};

const AdminPage = () => <Suspense fallback={<PageLoading />}><DashboardContent /></Suspense>;

export default AdminPage;
