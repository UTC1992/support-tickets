import { CheckCircle2, CircleDot, Headphones, UserRoundX } from "lucide-react";
import Link from "next/link";

type DashboardSummaryProps = {
  summary: {
    total: number;
    open: number;
    unassigned: number;
    completed: number;
  };
  ticketsHref: string;
  description: string;
};

const DashboardSummary = ({ summary, ticketsHref, description }: DashboardSummaryProps) => {
  const items = [
    { label: "Total de soportes", value: summary.total, icon: Headphones, color: "text-zinc-700" },
    { label: "Abiertos", value: summary.open, icon: CircleDot, color: "text-amber-600" },
    { label: "Sin asignar", value: summary.unassigned, icon: UserRoundX, color: "text-red-600" },
    { label: "Completados", value: summary.completed, icon: CheckCircle2, color: "text-emerald-600" },
  ];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-950">Resumen</h2>
        <p className="mt-1 text-sm text-zinc-600">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.label} href={ticketsHref} className="rounded-md border border-zinc-200 bg-white p-4 transition hover:border-zinc-400">
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

export default DashboardSummary;
