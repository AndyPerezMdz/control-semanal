import Link from "next/link";
import { ClipboardList, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--ink-primary)]">
          Control Semanal de Actividades
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-secondary)]">
          Registro y seguimiento del equipo de ingeniería.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/registro"
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)]"
        >
          <ClipboardList size={18} />
          Registrar mi actividad
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-medium text-[var(--ink-primary)] transition hover:bg-[var(--surface-muted)]"
        >
          <LayoutDashboard size={18} />
          Ver panel de control
        </Link>
      </div>
    </main>
  );
}
