import ExcelJS from "exceljs";
import type { Actividad } from "./types";
import type { ResumenSemana } from "./reportes";

const ESTILO_ENCABEZADO = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF1F2937" } },
  alignment: { vertical: "middle" as const },
};

function agregarHojaActividades(workbook: ExcelJS.Workbook, nombre: string, actividades: Actividad[]) {
  const hoja = workbook.addWorksheet(nombre);

  hoja.columns = [
    { header: "Ingeniero", key: "ingeniero", width: 16 },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "Hora inicio", key: "hora_inicio", width: 11 },
    { header: "Hora fin", key: "hora_fin", width: 11 },
    { header: "Categoría", key: "categoria", width: 26 },
    { header: "Descripción", key: "descripcion", width: 36 },
    { header: "Unidad / Ticket", key: "unidad_ticket", width: 16 },
    { header: "Prioridad", key: "prioridad", width: 11 },
    { header: "Estatus", key: "estatus", width: 22 },
    { header: "Evidencia", key: "evidencia", width: 11 },
    { header: "Referencia / Folio", key: "referencia_folio", width: 18 },
    { header: "Comentarios", key: "comentarios", width: 30 },
    { header: "Tiempo (min)", key: "tiempo_min", width: 13 },
    { header: "Carga ponderada", key: "carga_ponderada", width: 16 },
  ];

  hoja.getRow(1).eachCell((celda) => {
    celda.font = ESTILO_ENCABEZADO.font;
    celda.fill = ESTILO_ENCABEZADO.fill;
    celda.alignment = ESTILO_ENCABEZADO.alignment;
  });
  hoja.views = [{ state: "frozen", ySplit: 1 }];

  for (const a of actividades) {
    hoja.addRow({
      ingeniero: a.empleados?.nombre ?? "—",
      fecha: a.fecha,
      hora_inicio: a.hora_inicio ?? "",
      hora_fin: a.hora_fin ?? "",
      categoria: a.categorias?.nombre ?? "Sin categoría",
      descripcion: a.descripcion ?? "",
      unidad_ticket: a.unidad_ticket ?? "",
      prioridad: a.prioridad,
      estatus: a.estatus,
      evidencia: a.evidencia,
      referencia_folio: a.referencia_folio ?? "",
      comentarios: a.comentarios ?? "",
      tiempo_min: a.tiempo_min ? Math.round(a.tiempo_min) : "",
      carga_ponderada: a.carga_ponderada ? Math.round(a.carga_ponderada) : "",
    });
  }

  if (actividades.length === 0) {
    hoja.addRow({ ingeniero: "Sin actividades registradas." });
  }

  return hoja;
}

/** Excel de un solo día: una hoja plana con las actividades de todos los ingenieros ese día. */
export function construirExcelDia(fecha: string, actividades: Actividad[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Control Semanal";
  workbook.created = new Date();
  agregarHojaActividades(workbook, `Actividades ${fecha}`, actividades);
  return workbook;
}

/** Excel de una semana: hoja de resumen (igual al dashboard) + hoja plana con todas las actividades. */
export function construirExcelSemana(
  desde: string,
  hasta: string,
  actividades: Actividad[],
  resumen: ResumenSemana
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Control Semanal";
  workbook.created = new Date();

  const resumenHoja = workbook.addWorksheet("Resumen");
  resumenHoja.columns = [
    { key: "a", width: 26 },
    { key: "b", width: 14 },
    { key: "c", width: 12 },
    { key: "d", width: 12 },
    { key: "e", width: 14 },
    { key: "f", width: 14 },
    { key: "g", width: 18 },
    { key: "h", width: 16 },
  ];

  resumenHoja.addRow([`Semana del ${desde} al ${hasta}`]).font = { bold: true, size: 13 };
  resumenHoja.addRow([]);
  resumenHoja.addRow(["Actividades registradas", resumen.totalActividades]);
  resumenHoja.addRow(["Horas registradas", Number(resumen.horasTotales.toFixed(1))]);
  resumenHoja.addRow(["Carga ponderada", Math.round(resumen.cargaTotal)]);
  resumenHoja.addRow(["Pendientes", resumen.pendientes]);
  resumenHoja.addRow([]);

  const filaTituloEmpleado = resumenHoja.addRow([
    "Ingeniero", "Actividades", "Horas", "Carga", "Finalizadas", "Pendientes", "Evidencia faltante", "Prom. min/act.",
  ]);
  filaTituloEmpleado.eachCell((celda) => {
    celda.font = ESTILO_ENCABEZADO.font;
    celda.fill = ESTILO_ENCABEZADO.fill;
  });
  for (const fila of resumen.porEmpleado) {
    resumenHoja.addRow([
      fila.empleado.nombre,
      fila.actividades,
      Number(fila.horas.toFixed(1)),
      Math.round(fila.carga),
      fila.finalizadas,
      fila.pendientes,
      fila.evidenciaFaltante,
      Math.round(fila.promedioMin),
    ]);
  }

  resumenHoja.addRow([]);
  const filaTituloCategoria = resumenHoja.addRow(["Actividad", "Número", "Minutos", "Carga"]);
  filaTituloCategoria.eachCell((celda) => {
    celda.font = ESTILO_ENCABEZADO.font;
    celda.fill = ESTILO_ENCABEZADO.fill;
  });
  for (const fila of resumen.porCategoria) {
    resumenHoja.addRow([fila.categoria.nombre, fila.numero, Math.round(fila.minutos), Math.round(fila.carga)]);
  }

  agregarHojaActividades(workbook, "Actividades", actividades);

  return workbook;
}
