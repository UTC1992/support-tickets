"use client";

import { Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { FormEvent } from "react";
import useUserManager from "@/features/users/hooks/useUserManager";
import type { UserItem } from "@/features/users/types";

type UserManagerProps = { initialUsers: UserItem[]; currentUserId: string };

const roleLabels = { admin: "Administrador", office: "Oficina", technician: "Tecnico" };

const UserManager = ({ initialUsers, currentUserId }: UserManagerProps) => {
  const {
    authMethod,
    closeForm,
    deleteUser,
    editing,
    error,
    isOpen,
    isSaving,
    openCreate,
    openEdit,
    saveUser,
    setAuthMethod,
    toggleActive,
    users,
  } = useUserManager(initialUsers);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveUser(new FormData(event.currentTarget));
  };

  const remove = (user: UserItem) => {
    if (!window.confirm(`Eliminar el perfil de ${user.fullName}?`)) return;
    deleteUser(user);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"><Plus className="size-4" /> Crear usuario</button>
      </div>
      <p className="mb-4 text-sm text-zinc-600">Crea accesos con correo o telefono y una contrasena temporal.</p>
      {error && !isOpen ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
      <div className="overflow-hidden border-y border-zinc-200 bg-white sm:rounded-md sm:border">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-950">{user.fullName}{user.id === currentUserId ? " (tu cuenta)" : ""}</p>
              <p className="truncate text-xs text-zinc-500">{user.email ?? user.phone ?? "Sin identificador"} · {roleLabels[user.role]} · {user.isActive ? "Activo" : "Inactivo"}</p>
            </div>
            <button type="button" onClick={() => openEdit(user)} title="Editar" aria-label={`Editar ${user.fullName}`} className="grid size-9 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100"><Pencil className="size-4" /></button>
            <button type="button" onClick={() => toggleActive(user)} disabled={user.id === currentUserId} title="Cambiar estado" aria-label={`Cambiar estado de ${user.fullName}`} className="grid size-9 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"><Power className="size-4" /></button>
            <button type="button" onClick={() => remove(user)} disabled={user.id === currentUserId} title="Eliminar perfil" aria-label={`Eliminar ${user.fullName}`} className="grid size-9 place-items-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit} className="w-full bg-white p-5 shadow-xl sm:max-w-md sm:rounded-md">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold">{editing ? "Editar usuario" : "Crear usuario"}</h3><button type="button" onClick={closeForm} aria-label="Cerrar" className="grid size-9 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button></div>
            {!editing ? (
              <div className="mb-4 grid grid-cols-2 rounded-md bg-zinc-100 p-1" aria-label="Metodo de acceso">
                <button type="button" onClick={() => setAuthMethod("email")} className={`h-9 rounded px-3 text-sm font-medium ${authMethod === "email" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-600"}`}>Correo</button>
                <button type="button" onClick={() => setAuthMethod("phone")} className={`h-9 rounded px-3 text-sm font-medium ${authMethod === "phone" ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-600"}`}>Telefono</button>
              </div>
            ) : null}
            {!editing && authMethod === "email" ? <label className="block text-sm font-medium">Correo<input name="email" type="email" required autoFocus autoComplete="email" placeholder="usuario@empresa.com" className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label> : null}
            {!editing && authMethod === "phone" ? <label className="block text-sm font-medium">Telefono<input name="phone" type="tel" required autoFocus autoComplete="tel" placeholder="+593999999999" className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label> : null}
            {!editing ? <label className="mt-4 block text-sm font-medium">Contrasena temporal<input name="password" type="password" minLength={8} required autoComplete="new-password" className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label> : null}
            <label className={`${editing ? "" : "mt-4"} block text-sm font-medium`}>Nombre completo<input name="fullName" defaultValue={editing?.fullName} required autoFocus={Boolean(editing)} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label>
            {editing || authMethod === "email" ? <label className="mt-4 block text-sm font-medium">Rol<select name="role" defaultValue={editing?.role ?? "office"} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base"><option value="office">Oficina</option><option value="technician">Tecnico</option><option value="admin">Administrador</option></select></label> : <p className="mt-4 text-sm text-zinc-600">El acceso por telefono se creara con rol Tecnico.</p>}
            {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={closeForm} className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cancelar</button><button type="submit" disabled={isSaving} className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">{isSaving ? "Guardando..." : "Guardar"}</button></div>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default UserManager;
