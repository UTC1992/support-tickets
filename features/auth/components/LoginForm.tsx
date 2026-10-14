"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPassword } from "@/features/auth/services/auth-service";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const passwordUpdated = searchParams.get("passwordUpdated") === "1";
  const invalidInvite = searchParams.get("error") === "invalid_invite";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = await signInWithPassword(identifier, password);

    setIsSubmitting(false);

    if (authError) {
      setError("Correo, telefono o contrasena incorrectos");
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-950">Iniciar sesion</h1>
        <p className="text-sm text-zinc-600">Ingresa con tu cuenta autorizada.</p>
      </div>

      {passwordUpdated ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Contrasena creada. Ya puedes iniciar sesion.
        </p>
      ) : null}

      {invalidInvite ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          La invitacion vencio o no es valida.
        </p>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
        Correo o telefono
        <input
          className="h-11 rounded-md border border-zinc-300 px-3 text-base font-normal outline-none transition focus:border-zinc-900"
          type="text"
          autoComplete="username"
          placeholder="correo@empresa.com o +593..."
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800">
        Contrasena
        <input
          className="h-11 rounded-md border border-zinc-300 px-3 text-base font-normal outline-none transition focus:border-zinc-900"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 rounded-md bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isSubmitting ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
};

export default LoginForm;
