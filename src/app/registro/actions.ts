"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ESTATUS, EVIDENCIAS, PRIORIDADES } from "@/lib/types";

const ActividadSchema = z.object({
  empleado_id: z.string().uuid({ message: "Elige tu nombre." }),
  pin: z.string().regex(/^\d{4}$/, "El PIN debe ser de 4 dígitos."),
  categoria_id: z.string().uuid({ message: "Elige una categoría." }),
  fecha: z.string().min(1, "Falta la fecha."),
  hora_inicio: z.string().optional().or(z.literal("")),
  hora_fin: z.string().optional().or(z.literal("")),
  descripcion: z.string().optional().or(z.literal("")),
  unidad_ticket: z.string().optional().or(z.literal("")),
  prioridad: z.enum(PRIORIDADES as [string, ...string[]]),
  estatus: z.enum(ESTATUS as [string, ...string[]]),
  evidencia: z.enum(EVIDENCIAS as [string, ...string[]]),
  referencia_folio: z.string().optional().or(z.literal("")),
  comentarios: z.string().optional().or(z.literal("")),
});

export type RegistrarActividadState = {
  ok: boolean;
  error?: string;
};

export async function registrarActividad(
  _prevState: RegistrarActividadState,
  formData: FormData
): Promise<RegistrarActividadState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ActividadSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: pinValido, error: pinError } = await supabase.rpc("verify_empleado_pin", {
    p_id: data.empleado_id,
    p_pin: data.pin,
  });

  if (pinError || !pinValido) {
    return { ok: false, error: "PIN incorrecto. Pídele a tu jefe que te lo confirme o te asigne uno." };
  }

  const { error } = await supabase.from("actividades").insert({
    empleado_id: data.empleado_id,
    categoria_id: data.categoria_id,
    fecha: data.fecha,
    hora_inicio: data.hora_inicio || null,
    hora_fin: data.hora_fin || null,
    descripcion: data.descripcion || null,
    unidad_ticket: data.unidad_ticket || null,
    prioridad: data.prioridad,
    estatus: data.estatus,
    evidencia: data.evidencia,
    referencia_folio: data.referencia_folio || null,
    comentarios: data.comentarios || null,
  });

  if (error) {
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo en un momento." };
  }

  return { ok: true };
}
