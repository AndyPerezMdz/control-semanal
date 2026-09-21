import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import ActivityForm from "@/components/ActivityForm";
import LoginIngeniero from "@/components/LoginIngeniero";
import { cerrarSesionIngeniero } from "./actions";
import { verificarTokenSesion, SESSION_COOKIE } from "@/lib/session";
import type { Categoria, Empleado } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const cookieStore = await cookies();
  const empleadoId = verificarTokenSesion(cookieStore.get(SESSION_COOKIE)?.value);

  const supabase = await createClient();

  if (empleadoId) {
    const [{ data: empleado }, { data: categorias }] = await Promise.all([
      supabase.from("empleados").select("id, nombre, activo").eq("id", empleadoId).maybeSingle(),
      supabase.from("categorias").select("*").eq("activo", true).order("orden"),
    ]);

    if (empleado && empleado.activo) {
      return (
        <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
          <header className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-[var(--ink-primary)]">
                Registrar actividad
              </h1>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                Registrando como <strong>{empleado.nombre}</strong>.
              </p>
            </div>
            <form action={cerrarSesionIngeniero}>
              <button
                type="submit"
                className="whitespace-nowrap text-xs font-medium text-[var(--ink-secondary)] underline hover:text-[var(--ink-primary)]"
              >
                No soy yo, salir
              </button>
            </form>
          </header>

          <ActivityForm categorias={(categorias ?? []) as Categoria[]} />
        </main>
      );
    }
    // Sesión válida pero el empleado ya no existe o fue desactivado:
    // se trata igual que si no hubiera sesión, y sigue abajo al login.
  }

  const { data: empleados } = await supabase
    .from("empleados")
    .select("id, nombre, activo")
    .eq("activo", true)
    .order("nombre");

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink-primary)]">
          Registrar actividad
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-secondary)]">
          Elige tu nombre y tu PIN — después no te lo vuelve a pedir por un rato.
        </p>
      </header>

      <LoginIngeniero empleados={(empleados ?? []) as Empleado[]} />
    </main>
  );
}
