import { Headphones, LogOut } from "lucide-react";
import type { ReactNode } from "react";

type TechnicianShellProps = {
  children: ReactNode;
  technicianName: string;
};

const TechnicianShell = ({ children, technicianName }: TechnicianShellProps) => (
  <div className="min-h-screen bg-zinc-50 text-zinc-950">
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-emerald-700">Exitcomp</p>
          <div className="flex items-center gap-2">
            <Headphones aria-hidden="true" className="size-4 shrink-0 text-zinc-500" />
            <h1 className="truncate text-base font-semibold">Mis soportes</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-48 truncate text-sm text-zinc-600 sm:inline">{technicianName}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" title="Cerrar sesion" aria-label="Cerrar sesion" className="grid size-9 place-items-center rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-100">
              <LogOut aria-hidden="true" className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
    <main className="mx-auto w-full max-w-3xl px-4 py-5">{children}</main>
  </div>
);

export default TechnicianShell;
