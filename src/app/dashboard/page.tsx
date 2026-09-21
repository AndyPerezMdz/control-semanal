import Link from "next/link";
import { ClipboardList, Clock, Gauge, AlertTriangle, ChevronLeft, ChevronRight, Users, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWeekRange, addDays, formatFechaLarga } from "@/lib/week";
import { calcularResumen } from "@/lib/reportes";
import type { Actividad, Categoria, Empleado } from "@/lib/types";
import StatCard from "@/components/StatCard";
import { EstatusBadge, PrioridadBadge } from "@/components/StatusBadge";
import LogoutButton from "@/components/LogoutButton";
import WeekPicker from "@/components/WeekPicker";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>;
}) {
  const { desde: desdeParam } = await searchParams;
  const { desde, hasta } = getWeekRange(desdeParam);

  const supabase = await createClient();

  const [{ data: actividadesData }, { data: empleadosData }, { data: categoriasData }] =
    await Promise.all([
      supabase
        .from("actividades")
        .select("*, empleados(nombre), categorias(nombre)")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("creado_en", { ascending: false }),
      supabase.from("empleados").select("*").order("nombre"),
      supabase.from("categorias").select("*").order("orden"),
    ]);

  const actividades = (actividadesData ?? []) as Actividad[];
  const empleados = (empleadosData ?? []) as Empleado[];
  const categorias = (categoriasData ?? []) as Categoria[];

  const { totalActividades, horasTotales, cargaTotal, pendientes, porEmpleado, porCategoria } =
    calcularResumen(actividades, empleados, categorias);

  // El botón de "descargar semana" solo aparece para semanas ya cerradas, o
  // para la semana en curso una vez que llega el fin de semana (viernes a
  // domingo) — igual que como se revisaba en el Excel cada viernes.
  const hoyStr = new Date().toISOString().slice(0, 10);
  const esSemanaActual = hoyStr >= desde && hoyStr <= hasta;
  const diaDeHoy = new Date().getDay(); // 0 = domingo, 5 = viernes, 6 = sábado
  const esFinDeSemana = diaDeHoy === 5 || diaDeHoy === 6 || diaDeHoy === 0;
  const mostrarDescargaSemana = hasta < hoyStr || (esSemanaActual && esFinDeSemana);
  const fechaSugerida = esSemanaActual ? hoyStr : hasta;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--ink-primary)]">Panel de control</h1>
          <p className="mt-1 text-sm text-[var(--ink-secondary)]">
            Semana del {formatFechaLarga(desde)} al {formatFechaLarga(hasta)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WeekPicker desde={desde} />
          <Link
            href={`/dashboard?desde=${addDays(desde, -7)}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
          >
            <ChevronLeft size={16} />
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
          >
            Esta semana
          </Link>
          <Link
            href={`/dashboard?desde=${addDays(desde, 7)}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
          >
            <ChevronRight size={16} />
          </Link>
          <Link
            href="/dashboard/equipo"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
          >
            <Users size={14} />
            Equipo
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--ink-secondary)]">
          <Download size={14} />
          Descargar Excel:
        </span>
        <form action="/dashboard/exportar/dia" method="GET" className="flex items-center gap-2">
          <input
            type="date"
            name="fecha"
            defaultValue={fechaSugerida}
            className="rounded-lg border border-[var(--border)] bg-white px-2 py-1 text-xs text-[var(--ink-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          <button
            type="submit"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
          >
            Del día
          </button>
        </form>
        {mostrarDescargaSemana && (
          <a
            href={`/dashboard/exportar/semana?desde=${desde}`}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] hover:bg-[var(--surface-muted)]"
          >
            De la semana ({formatFechaLarga(desde)} – {formatFechaLarga(hasta)})
          </a>
        )}
      </div>

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Actividades registradas" value={totalActividades} icon={ClipboardList} />
        <StatCard label="Horas registradas" value={horasTotales.toFixed(1)} icon={Clock} />
        <StatCard label="Carga ponderada" value={cargaTotal.toFixed(0)} icon={Gauge} />
        <StatCard label="Pendientes" value={pendientes} icon={AlertTriangle} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink-primary)]">Comparativo por ingeniero</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-secondary)]">
                <th className="px-4 py-2 font-medium">Ingeniero</th>
                <th className="px-4 py-2 font-medium">Actividades</th>
                <th className="px-4 py-2 font-medium">Horas</th>
                <th className="px-4 py-2 font-medium">Carga</th>
                <th className="px-4 py-2 font-medium">Finalizadas</th>
                <th className="px-4 py-2 font-medium">Pendientes</th>
                <th className="px-4 py-2 font-medium">Evidencia faltante</th>
                <th className="px-4 py-2 font-medium">Prom. min/act.</th>
              </tr>
            </thead>
            <tbody>
              {porEmpleado.map((fila) => (
                <tr key={fila.empleado.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 font-medium text-[var(--ink-primary)]">{fila.empleado.nombre}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.actividades}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.horas.toFixed(1)}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.carga.toFixed(0)}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.finalizadas}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.pendientes}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.evidenciaFaltante}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.promedioMin.toFixed(0)}</td>
                </tr>
              ))}
              {porEmpleado.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-[var(--ink-muted)]">
                    Aún no hay empleados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink-primary)]">Distribución por tipo de actividad</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs text-[var(--ink-secondary)]">
                <th className="px-4 py-2 font-medium">Actividad</th>
                <th className="px-4 py-2 font-medium">Número</th>
                <th className="px-4 py-2 font-medium">Minutos</th>
                <th className="px-4 py-2 font-medium">Carga</th>
              </tr>
            </thead>
            <tbody>
              {porCategoria.map((fila) => (
                <tr key={fila.categoria.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-2 font-medium text-[var(--ink-primary)]">{fila.categoria.nombre}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.numero}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.minutos.toFixed(0)}</td>
                  <td className="px-4 py-2 text-[var(--ink-secondary)]">{fila.carga.toFixed(0)}</td>
                </tr>
              ))}
              {porCategoria.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-[var(--ink-muted)]">
                    Sin actividades registradas esta semana.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--ink-primary)]">Actividad reciente</h2>
        <div className="flex flex-col gap-2">
          {actividades.slice(0, 15).map((a) => (
            <div
              key={a.id}
              className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-[var(--ink-primary)]">
                  {a.empleados?.nombre ?? "—"} · {a.categorias?.nombre ?? "Sin categoría"}
                </p>
                <p className="text-xs text-[var(--ink-secondary)]">
                  {a.fecha} {a.unidad_ticket ? `· ${a.unidad_ticket}` : ""}
                  {a.descripcion ? ` · ${a.descripcion}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PrioridadBadge prioridad={a.prioridad} />
                <EstatusBadge estatus={a.estatus} />
              </div>
            </div>
          ))}
          {actividades.length === 0 && (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--ink-muted)]">
              Nadie ha registrado actividades esta semana todavía.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
