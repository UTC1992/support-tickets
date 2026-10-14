"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/features/auth/components/PasswordInput";
import createSupabaseBrowserClient from "@/lib/auth/supabase-browser";

const SetPasswordForm = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });

      if (updateError) {
        setError(
          updateError.message.toLowerCase().includes("session")
            ? "La sesión venció. Inicia sesión nuevamente con tu contraseña temporal"
            : updateError.message,
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("No se pudo cambiar la contraseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-950">Cambiar contraseña</h1>
        <p className="text-sm text-zinc-600">Por seguridad, reemplaza la contraseña temporal.</p>
      </div>
      <PasswordInput label="Contraseña" minLength={8} autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      <PasswordInput label="Confirmar contraseña" minLength={8} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
      {error ? <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={isSubmitting} className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400">{isSubmitting ? "Guardando..." : "Guardar contraseña"}</button>
    </form>
  );
};

export default SetPasswordForm;
