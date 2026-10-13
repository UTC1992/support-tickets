import { CheckCircle2, CircleDot, Headphones, UserRoundX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import AdminLoading from "@/features/admin/components/AdminLoading";
import AdminPageHeader from "@/features/admin/components/AdminPageHeader";
import { getAdminDashboard } from "@/features/admin/services/admin-service";

const DashboardContent = async () => {
  const summary = await getAdminDashboard();
  const items = [
    { label: "Total de soportes", value: summary.total, icon: Headphones, color: "text-zinc-700" },
    { label: "Abiertos", value: summary.open, icon: CircleDot, color: "text-amber-600" },
    { label: "Sin asignar", value: summary.unassigned, icon: UserRoundX, color: "text-red-600" },
    { label: "Completados", value: summary.completed, icon: CheckCircle2, color: "text-emerald-600" },
  ];

  return (
    <>
      <AdminPageHeader title="Resumen" description="Estado general de la gestion de soportes." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href="/admin/tickets" className="rounded-md border border-zinc-200 bg-white p-4 transition hover:border-zinc-400">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-zinc-600">{item.label}</p>
                <Icon aria-hidden="true" className={`size-5 ${item.color}`} />
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-950">{item.value}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
};

const AdminPage = () => <Suspense fallback={<AdminLoading />}><DashboardContent /></Suspense>;

export default AdminPage;
