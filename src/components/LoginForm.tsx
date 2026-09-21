"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { iniciarSesion, type LoginState } from "@/app/login/actions";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(iniciarSesion, {});

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-critical)]/30 bg-[var(--status-critical-bg)] px-3 py-2 text-sm text-[var(--status-critical)]">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ink-secondary)]" htmlFor="email">
          Correo
        </label>
        <input id="email" name="email" type="email" required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--ink-secondary)]" htmlFor="password">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required className={inputClass} />
      </div>

      <SubmitButton />
    </form>
  );
}
