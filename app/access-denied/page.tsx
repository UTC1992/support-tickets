import { ShieldX } from "lucide-react";

const AccessDeniedPage = () => (
  <main className="grid min-h-screen place-items-center bg-zinc-50 px-4">
    <div className="w-full max-w-sm rounded-md border border-zinc-200 bg-white p-6 text-center">
      <ShieldX aria-hidden="true" className="mx-auto size-10 text-red-600" />
      <h1 className="mt-4 text-xl font-semibold text-zinc-950">Acceso restringido</h1>
      <p className="mt-2 text-sm text-zinc-600">Tu cuenta no tiene permisos de administrador.</p>
      <form action="/api/auth/logout" method="post" className="mt-5">
        <button type="submit" className="h-10 w-full rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">Cerrar sesion</button>
      </form>
    </div>
  </main>
);

export default AccessDeniedPage;
