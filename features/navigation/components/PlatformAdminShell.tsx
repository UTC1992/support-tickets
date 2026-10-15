import { Building2, LogOut } from "lucide-react";
import type { ReactNode } from "react";

type PlatformAdminShellProps = { children: ReactNode };

const PlatformAdminShell = ({ children }: PlatformAdminShellProps) => (
  <div className="min-h-screen bg-zinc-50 text-zinc-950">
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase text-emerald-700">Exitcomp</p>
          <div className="flex items-center gap-2"><Building2 className="size-4 text-zinc-500" /><h1 className="text-base font-semibold sm:text-lg">Empresas</h1></div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button type="submit" title="Cerrar sesión" aria-label="Cerrar sesión" className="grid size-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"><LogOut className="size-4" /></button>
        </form>
      </div>
    </header>
    <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
  </div>
);

export default PlatformAdminShell;
