"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PIN_REGEX = /^\d{4}$/;

function mensajeError(contexto: string, error: { message: string; code?: string }): string {
  // Cuando las funciones set_empleado_pin/verify_empleado_pin no existen aún en
  // Supabase (falta correr supabase/add_pin.sql), Postgres regresa este código.
  if (error.code === "PGRST202" || /function .* does not exist/i.test(error.message)) {
    return "Falta configurar el PIN en la base de datos (falta correr add_pin.sql en Supabase). Avísale a Andy.";
  }
  return `${contexto}: ${error.message}`;
}

export async function agregarEmpleado(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  if (!nombre) redirect("/dashboard/equipo?error=" + encodeURIComponent("Falta el nombre."));
  if (!PIN_REGEX.test(pin))
    redirect("/dashboard/equipo?error=" + encodeURIComponent("El PIN debe ser de 4 dígitos."));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empleados")
    .insert({ nombre })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/dashboard/equipo?error=" + encodeURIComponent(mensajeError("No se pudo agregar al ingeniero", error ?? { message: "sin datos" })));
  }

  const { error: pinError } = await supabase.rpc("set_empleado_pin", { p_id: data.id, p_pin: pin });

  revalidatePath("/dashboard/equipo");
  revalidatePath("/registro");

  if (pinError) {
    redirect("/dashboard/equipo?error=" + encodeURIComponent(mensajeError("Se agregó, pero no se pudo asignar el PIN", pinError)));
  }
}

export async function cambiarEstadoEmpleado(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const activo = String(formData.get("activo")) === "true";
  if (!id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("empleados").update({ activo }).eq("id", id);

  revalidatePath("/dashboard/equipo");
  revalidatePath("/registro");

  if (error) {
    redirect("/dashboard/equipo?error=" + encodeURIComponent(mensajeError("No se pudo cambiar el estado", error)));
  }
}

export async function establecerPin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const pin = String(formData.get("pin") ?? "");
  if (!id) return;
  if (!PIN_REGEX.test(pin))
    redirect("/dashboard/equipo?error=" + encodeURIComponent("El PIN debe ser de 4 dígitos."));

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_empleado_pin", { p_id: id, p_pin: pin });

  revalidatePath("/dashboard/equipo");

  if (error) {
    redirect("/dashboard/equipo?error=" + encodeURIComponent(mensajeError("No se pudo asignar el PIN", error)));
  }
}
