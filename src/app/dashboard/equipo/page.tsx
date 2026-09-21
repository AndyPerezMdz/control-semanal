import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Empleado } from "@/lib/types";
import { agregarEmpleado, cambiarEstadoEmpleado } from "./actions";

export const dynamic = "force-dynamic";

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("empleados").select("*").order("nombre");
  const empleados = (data ?? []) as Empleado[];

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
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
            Altas y bajas de ingenieros. No se borran para no perder su historial — se desactivan.
          </p>
        </div>
      </header>

      <form action={agregarEmpleado} className="mb-6 flex gap-2">
        <input
          type="text"
          name="nombre"
          required
          placeholder="Nombre del nuevo ingeniero"
          className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
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
          <div
            key={e.id}
            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white p-3"
          >
            <span
              className={
                e.activo
                  ? "text-sm font-medium text-[var(--ink-primary)]"
                  : "text-sm font-medium text-[var(--ink-muted)] line-through"
              }
            >
              {e.nombre}
            </span>
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
