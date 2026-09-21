import Link from "next/link";
import { ArrowLeft, UserPlus, KeyRound, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Empleado } from "@/lib/types";
import { agregarEmpleado, cambiarEstadoEmpleado, establecerPin } from "./actions";

export const dynamic = "force-dynamic";

const inputClass =
  "rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

type PinFila = { empleado_id: string; pin: string | null };

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorParam } = await searchParams;
  const supabase = await createClient();

  const [{ data }, { data: pinesData }] = await Promise.all([
    supabase.from("empleados").select("id, nombre, activo").order("nombre"),
    supabase.rpc("obtener_pines"),
  ]);

  const pines = new Map((pinesData as PinFila[] | null ?? []).map((f) => [f.empleado_id, f.pin]));
  const empleados = ((data ?? []) as Empleado[]).map((e) => ({ ...e, pin: pines.get(e.id) ?? null }));

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      {errorParam && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-[var(--status-critical)]/30 bg-[var(--status-critical-bg)] px-4 py-3 text-sm text-[var(--status-critical)]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{errorParam}</span>
        </div>
      )}
      <header className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink-primary)]">Equipo</h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            Altas y bajas, y el PIN de 4 dígitos que cada quien usa para registrar sus actividades.
          </p>
        </div>
      </header>

      <form action={agregarEmpleado} className="mb-6 flex flex-wrap gap-2">
        <input
          type="text"
          name="nombre"
          required
          placeholder="Nombre del nuevo ingeniero"
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="password"
          name="pin"
          required
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          autoComplete="off"
          placeholder="PIN (4 dígitos)"
          className={`w-32 ${inputClass}`}
        />
        <button
          type="submit"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
        >
          <UserPlus size={16} />
          Agregar
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {empleados.map((e) => (
          <div key={e.id} className="rounded-xl border border-[var(--border)] bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={
                    e.activo
                      ? "text-sm font-medium text-[var(--ink-primary)]"
                      : "text-sm font-medium text-[var(--ink-muted)] line-through"
                  }
                >
                  {e.nombre}
                </span>
                {e.pin ? (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-xs font-medium text-[var(--ink-secondary)]">
                    <KeyRound size={12} />
                    {e.pin}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 rounded-full bg-[var(--status-warning-bg)] px-2 py-0.5 text-xs font-medium text-[var(--status-warning)]">
                    <AlertCircle size={12} />
                    Sin PIN
                  </span>
                )}
              </div>

              <form action={cambiarEstadoEmpleado}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="activo" value={(!e.activo).toString()} />
                <button
                  type="submit"
                  className={
                    e.activo
                      ? "rounded-lg border border-[var(--status-critical)]/30 bg-[var(--status-critical-bg)] px-3 py-1.5 text-xs font-medium text-[var(--status-critical)] hover:opacity-80"
                      : "rounded-lg border border-[var(--status-good)]/30 bg-[var(--status-good-bg)] px-3 py-1.5 text-xs font-medium text-[var(--status-good)] hover:opacity-80"
                  }
                >
                  {e.activo ? "Desactivar" : "Reactivar"}
                </button>
              </form>
            </div>

            <form action={establecerPin} className="mt-2 flex items-center gap-2">
              <input type="hidden" name="id" value={e.id} />
              <KeyRound size={14} className="text-[var(--ink-muted)]" />
              <input
                type="password"
                name="pin"
                required
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="off"
                placeholder="Nuevo PIN"
                className={`w-28 py-1.5 text-xs ${inputClass}`}
              />
              <button
                type="submit"
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
              >
                {e.pin ? "Cambiar PIN" : "Asignar PIN"}
              </button>
            </form>
          </div>
        ))}
        {empleados.length === 0 && (
          <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
            No hay ingenieros registrados todavía.
          </p>
        )}
      </div>
    </main>
  );
}
