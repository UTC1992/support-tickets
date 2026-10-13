"use client";

import { Headphones, LayoutDashboard, LogOut, MapPin, Tags, UserRoundCog, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard },
  { href: "/admin/tickets", label: "Soportes", icon: Headphones },
  { href: "/admin/technicians", label: "Tecnicos", icon: Users },
  { href: "/admin/zones", label: "Zonas", icon: MapPin },
  { href: "/admin/support-types", label: "Tipos", icon: Tags },
  { href: "/admin/users", label: "Usuarios", icon: UserRoundCog },
];

type AdminShellProps = { children: ReactNode; userName: string };

const AdminShell = ({ children, userName }: AdminShellProps) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">Exitcomp</p>
            <h1 className="text-base font-semibold sm:text-lg">Gestion de soportes</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-zinc-600 sm:inline">{userName}</span>
            <form action="/api/auth/logout" method="post">
              <button type="submit" title="Cerrar sesion" aria-label="Cerrar sesion" className="grid size-9 place-items-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:bg-zinc-100">
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2" aria-label="Administracion">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition ${isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"}`}>
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
};

export default AdminShell;
