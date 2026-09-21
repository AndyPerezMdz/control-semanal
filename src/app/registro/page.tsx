import { createClient } from "@/lib/supabase/server";
import ActivityForm from "@/components/ActivityForm";
import type { Categoria, Empleado } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegistroPage() {
  const supabase = await createClient();

  const [{ data: empleados }, { data: categorias }] = await Promise.all([
    supabase.from("empleados").select("id, nombre, activo").order("nombre"),
    supabase.from("categorias").select("*").order("orden"),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--ink-primary)]">
          Registrar actividad
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-secondary)]">
          Elige tu nombre, no necesitas usuario ni contraseña.
        </p>
      </header>

      <ActivityForm
        empleados={(empleados ?? []) as Empleado[]}
        categorias={(categorias ?? []) as Categoria[]}
      />
    </main>
  );
}
