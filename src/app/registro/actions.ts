"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ESTATUS, EVIDENCIAS, PRIORIDADES } from "@/lib/types";
import {
  crearTokenSesion,
  verificarTokenSesion,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEG,
} from "@/lib/session";

// --------------------------------------------------------------------------
// Login del ingeniero: nombre + PIN una sola vez, deja una sesión de 8 horas
// --------------------------------------------------------------------------
const LoginSchema = z.object({
  empleado_id: z.string().uuid({ message: "Elige tu nombre." }),
  pin: z.string().regex(/^\d{4}$/, "El PIN debe ser de 4 dígitos."),
});

export type LoginIngenieroState = { error?: string };

export async function iniciarSesionIngeniero(
  _prevState: LoginIngenieroState,
  formData: FormData
): Promise<LoginIngenieroState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  }

  const supabase = await createClient();
  const { data: pinValido, error } = await supabase.rpc("verify_empleado_pin", {
    p_id: parsed.data.empleado_id,
    p_pin: parsed.data.pin,
  });

  if (error || !pinValido) {
    return { error: "Nombre o PIN incorrecto." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, crearTokenSesion(parsed.data.empleado_id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_SEG,
    path: "/",
  });

  redirect("/registro");
}

export async function cerrarSesionIngeniero() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/registro");
}

// --------------------------------------------------------------------------
// Registrar una actividad: el empleado_id sale de la sesión, no del form —
// así nadie puede editar el HTML/form para registrar "como" otra persona.
// --------------------------------------------------------------------------
const ActividadSchema = z.object({
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
  const cookieStore = await cookies();
  const empleadoId = verificarTokenSesion(cookieStore.get(SESSION_COOKIE)?.value);

  if (!empleadoId) {
    return { ok: false, error: "Tu sesión expiró. Vuelve a poner tu nombre y PIN." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = ActividadSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("actividades").insert({
    empleado_id: empleadoId,
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
