"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PIN_REGEX = /^\d{4}$/;

export async function agregarEmpleado(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");
  if (!nombre || !PIN_REGEX.test(pin)) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empleados")
    .insert({ nombre })
    .select("id")
    .single();

  if (error || !data) return;

  await supabase.rpc("set_empleado_pin", { p_id: data.id, p_pin: pin });

  revalidatePath("/dashboard/equipo");
  revalidatePath("/registro");
}

export async function cambiarEstadoEmpleado(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const activo = String(formData.get("activo")) === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("empleados").update({ activo }).eq("id", id);

  revalidatePath("/dashboard/equipo");
  revalidatePath("/registro");
}

export async function establecerPin(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const pin = String(formData.get("pin") ?? "");
  if (!id || !PIN_REGEX.test(pin)) return;

  const supabase = await createClient();
  await supabase.rpc("set_empleado_pin", { p_id: id, p_pin: pin });

  revalidatePath("/dashboard/equipo");
}
