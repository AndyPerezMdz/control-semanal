"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function agregarEmpleado(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;

  const supabase = await createClient();
  await supabase.from("empleados").insert({ nombre });

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
