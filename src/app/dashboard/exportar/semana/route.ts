import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWeekRange } from "@/lib/week";
import { calcularResumen } from "@/lib/reportes";
import { construirExcelSemana } from "@/lib/excel";
import type { Actividad, Categoria, Empleado } from "@/lib/types";

export async function GET(request: NextRequest) {
  const desdeParam = request.nextUrl.searchParams.get("desde") ?? undefined;
  const { desde, hasta } = getWeekRange(desdeParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const [{ data: actividadesData, error }, { data: empleadosData }, { data: categoriasData }] =
    await Promise.all([
      supabase
        .from("actividades")
        .select("*, empleados(nombre), categorias(nombre)")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha", { ascending: true }),
      supabase.from("empleados").select("*").order("nombre"),
      supabase.from("categorias").select("*").order("orden"),
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const actividades = (actividadesData ?? []) as Actividad[];
  const empleados = (empleadosData ?? []) as Empleado[];
  const categorias = (categoriasData ?? []) as Categoria[];

  const resumen = calcularResumen(actividades, empleados, categorias);
  const workbook = construirExcelSemana(desde, hasta, actividades, resumen);
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="semana_${desde}_a_${hasta}.xlsx"`,
    },
  });
}
