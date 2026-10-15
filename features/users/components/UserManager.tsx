"use client";

import { KeyRound, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { FormEvent } from "react";
import PasswordInput from "@/features/auth/components/PasswordInput";
import useUserManager from "@/features/users/hooks/useUserManager";
import type {
  ManagedUserRole,
  TechnicianAccessOption,
  UserItem,
} from "@/features/users/types";
import { formatPhoneForDisplay } from "@/lib/services/phone";

type UserManagerProps = {
  initialUsers: UserItem[];
  currentUserId: string;
  managedRole: ManagedUserRole;
  availableTechnicians?: TechnicianAccessOption[];
};

const roleLabels = { admin: "Administrador", technician: "Técnico" };

const UserManager = ({
  initialUsers,
  currentUserId,
  managedRole,
  availableTechnicians: initialAvailableTechnicians = [],
}: UserManagerProps) => {
  const {
    availableTechnicians,
    authMethod,
    closeForm,
    closePasswordReset,
    deleteUser,
    editing,
    error,
    isOpen,
    isSaving,
    openCreate,
    openEdit,
    openPasswordReset,
    passwordUser,
    resetPassword,
    saveUser,
    successMessage,
    toggleActive,
    users,
  } = useUserManager(initialUsers, managedRole, initialAvailableTechnicians);

  const canCreateUser = managedRole === "admin" || availableTechnicians.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveUser(new FormData(event.currentTarget));
  };

  const remove = (user: UserItem) => {
    if (!window.confirm(`Eliminar el perfil de ${user.fullName}?`)) return;
    deleteUser(user);
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetPassword(new FormData(event.currentTarget));
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={openCreate} disabled={!canCreateUser} className="inline-flex h-11 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"><Plus className="size-4" /> {managedRole === "admin" ? "Crear administrador" : "Crear acceso"}</button>
      </div>
      <p className="mb-4 text-sm text-zinc-600">{managedRole === "admin" ? "Crea accesos con correo y una contraseña temporal." : "Selecciona un técnico registrado y asigna una contraseña temporal."}</p>
      {managedRole === "technician" && !canCreateUser ? <p className="mb-4 text-sm text-zinc-600">No hay técnicos activos con teléfono pendientes de acceso.</p> : null}
      {successMessage ? <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{successMessage}</p> : null}
      {error && !isOpen ? <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
      <div className="overflow-hidden border-y border-zinc-200 bg-white sm:rounded-md sm:border">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-950">{user.fullName}{user.id === currentUserId ? " (tu cuenta)" : ""}</p>
              <p className="truncate text-xs text-zinc-500">{user.email ?? (formatPhoneForDisplay(user.phone) || "Sin identificador")} · {roleLabels[user.role]} · {user.isActive ? "Activo" : "Inactivo"}</p>
            </div>
            <button type="button" onClick={() => openEdit(user)} title="Editar" aria-label={`Editar ${user.fullName}`} className="grid size-11 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100"><Pencil className="size-4" /></button>
            <button type="button" onClick={() => openPasswordReset(user)} disabled={user.id === currentUserId} title="Restablecer contraseña" aria-label={`Restablecer contraseña de ${user.fullName}`} className="grid size-11 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"><KeyRound className="size-4" /></button>
            <button type="button" onClick={() => toggleActive(user)} disabled={user.id === currentUserId} title="Cambiar estado" aria-label={`Cambiar estado de ${user.fullName}`} className="grid size-11 place-items-center rounded-md text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"><Power className="size-4" /></button>
            <button type="button" onClick={() => remove(user)} disabled={user.id === currentUserId} title="Eliminar perfil" aria-label={`Eliminar ${user.fullName}`} className="grid size-11 place-items-center rounded-md text-red-600 hover:bg-red-50 disabled:opacity-30"><Trash2 className="size-4" /></button>
          </div>
        ))}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleSubmit} className="w-full bg-white p-5 shadow-xl sm:max-w-md sm:rounded-md">
            <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold">{editing ? "Editar usuario" : managedRole === "admin" ? "Crear administrador" : "Crear acceso técnico"}</h3><button type="button" onClick={closeForm} aria-label="Cerrar" className="grid size-9 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button></div>
            <input type="hidden" name="role" value={managedRole} />
            {!editing && authMethod === "email" ? <label className="block text-sm font-medium">Correo<input name="email" type="email" required autoFocus autoComplete="email" placeholder="usuario@empresa.com" className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label> : null}
            {!editing && authMethod === "phone" ? (
              <label className="block text-sm font-medium">Técnico
                <select name="technicianId" required autoFocus defaultValue="" className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-base outline-none focus:border-zinc-900">
                  <option value="" disabled>Selecciona un técnico</option>
                  {availableTechnicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>{technician.name} - {formatPhoneForDisplay(technician.phone)}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {!editing ? <div className="mt-4"><PasswordInput name="password" label="Contraseña temporal" minLength={8} required autoComplete="new-password" /></div> : null}
            {editing || managedRole === "admin" ? <label className={`${editing ? "" : "mt-4"} block text-sm font-medium`}>Nombre completo<input name="fullName" defaultValue={editing?.fullName} required autoFocus={Boolean(editing)} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label> : null}
            {editing?.phone ? <label className="mt-4 block text-sm font-medium">Teléfono<input name="phone" type="tel" required autoComplete="tel" defaultValue={formatPhoneForDisplay(editing.phone)} placeholder="0999999999" onBlur={(event) => { event.currentTarget.value = formatPhoneForDisplay(event.currentTarget.value); }} className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 px-3 text-base outline-none focus:border-zinc-900" /></label> : null}
            <p className="mt-4 text-sm text-zinc-600">Rol: {roleLabels[managedRole]}.</p>
            {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={closeForm} className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cancelar</button><button type="submit" disabled={isSaving} className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">{isSaving ? "Guardando..." : "Guardar"}</button></div>
          </form>
        </div>
      ) : null}

      {passwordUser ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
          <form onSubmit={handlePasswordSubmit} className="w-full bg-white p-5 shadow-xl sm:max-w-md sm:rounded-md">
            <div className="mb-5 flex items-center justify-between">
              <h3 id="reset-password-title" className="text-lg font-semibold">Restablecer contraseña</h3>
              <button type="button" onClick={closePasswordReset} aria-label="Cerrar" className="grid size-11 place-items-center rounded-md hover:bg-zinc-100"><X className="size-5" /></button>
            </div>
            <p className="mb-4 text-sm text-zinc-600">Asigna una contraseña temporal a {passwordUser.fullName}. Deberá cambiarla al iniciar sesión.</p>
            <PasswordInput name="password" label="Nueva contraseña temporal" minLength={8} required autoComplete="new-password" />
            {error ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={closePasswordReset} className="h-11 rounded-md border border-zinc-300 px-4 text-sm font-medium">Cancelar</button>
              <button type="submit" disabled={isSaving} className="h-11 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:bg-zinc-400">{isSaving ? "Restableciendo..." : "Restablecer contraseña"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
};

export default UserManager;
