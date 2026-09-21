"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { iniciarSesionIngeniero, type LoginIngenieroState } from "@/app/registro/actions";
import type { Empleado } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

const labelClass = "mb-1 block text-sm font-medium text-[var(--ink-secondary)]";

function EntrarButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

const initialState: LoginIngenieroState = {};

export default function LoginIngeniero({ empleados }: { empleados: Empleado[] }) {
  const [state, formAction] = useActionState(iniciarSesionIngeniero, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-critical)]/30 bg-[var(--status-critical-bg)] px-3 py-2 text-sm text-[var(--status-critical)]">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="empleado_id">
          Tu nombre
        </label>
        <select id="empleado_id" name="empleado_id" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Selecciona tu nombre
          </option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="pin">
          Tu PIN (4 dígitos)
        </label>
        <input
          type="password"
          id="pin"
          name="pin"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoComplete="off"
          placeholder="••••"
          className={inputClass}
        />
      </div>

      <EntrarButton />
    </form>
  );
}
