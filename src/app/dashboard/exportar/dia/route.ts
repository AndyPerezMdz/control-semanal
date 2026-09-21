import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { construirExcelDia } from "@/lib/excel";
import type { Actividad } from "@/lib/types";

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const fecha = request.nextUrl.searchParams.get("fecha") ?? new Date().toISOString().slice(0, 10);
  if (!FECHA_REGEX.test(fecha)) {
    return NextResponse.json({ error: "Fecha inválida." }, { status: 400 });
  }

  // El middleware ya protege todo /dashboard/*, pero por si acaso se llama
  // directo a la ruta, confirmamos que hay una sesión de administrador.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("actividades")
    .select("*, empleados(nombre), categorias(nombre)")
    .eq("fecha", fecha)
    .order("hora_inicio", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const actividades = (data ?? []) as Actividad[];
  const workbook = construirExcelDia(fecha, actividades);
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="actividades_${fecha}.xlsx"`,
    },
  });
}
