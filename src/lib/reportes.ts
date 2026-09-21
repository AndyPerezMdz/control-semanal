import type { Actividad, Categoria, Empleado } from "./types";

const FINALIZADOS = new Set(["FINALIZADO", "FINALIZADO / RESTABLECIDO"]);
const PENDIENTES = new Set(["PENDIENTE", "BLOQUEADO"]);

export type FilaEmpleado = {
  empleado: Empleado;
  actividades: number;
  horas: number;
  carga: number;
  finalizadas: number;
  pendientes: number;
  evidenciaFaltante: number;
  promedioMin: number;
};

export type FilaCategoria = {
  categoria: Categoria;
  numero: number;
  minutos: number;
  carga: number;
};

export type ResumenSemana = {
  totalActividades: number;
  horasTotales: number;
  cargaTotal: number;
  pendientes: number;
  porEmpleado: FilaEmpleado[];
  porCategoria: FilaCategoria[];
};

/** Los mismos cálculos que usa /dashboard, para reusarlos también en las
 * exportaciones a Excel (que deben coincidir con lo que se ve en pantalla). */
export function calcularResumen(
  actividades: Actividad[],
  empleados: Empleado[],
  categorias: Categoria[]
): ResumenSemana {
  const totalActividades = actividades.length;
  const horasTotales = actividades.reduce((acc, a) => acc + (a.tiempo_min ?? 0), 0) / 60;
  const cargaTotal = actividades.reduce((acc, a) => acc + (a.carga_ponderada ?? 0), 0);
  const pendientes = actividades.filter(
    (a) => a.estatus === "PENDIENTE" || a.estatus === "BLOQUEADO"
  ).length;

  const porEmpleado: FilaEmpleado[] = empleados.map((emp) => {
    const propias = actividades.filter((a) => a.empleado_id === emp.id);
    const minutos = propias.reduce((acc, a) => acc + (a.tiempo_min ?? 0), 0);
    return {
      empleado: emp,
      actividades: propias.length,
      horas: minutos / 60,
      carga: propias.reduce((acc, a) => acc + (a.carga_ponderada ?? 0), 0),
      finalizadas: propias.filter((a) => FINALIZADOS.has(a.estatus)).length,
      pendientes: propias.filter((a) => PENDIENTES.has(a.estatus)).length,
      evidenciaFaltante: propias.filter((a) => a.evidencia === "NO").length,
      promedioMin: propias.length > 0 ? minutos / propias.length : 0,
    };
  });

  const porCategoria: FilaCategoria[] = categorias
    .map((cat) => {
      const propias = actividades.filter((a) => a.categoria_id === cat.id);
      return {
        categoria: cat,
        numero: propias.length,
        minutos: propias.reduce((acc, a) => acc + (a.tiempo_min ?? 0), 0),
        carga: propias.reduce((acc, a) => acc + (a.carga_ponderada ?? 0), 0),
      };
    })
    .filter((c) => c.numero > 0)
    .sort((a, b) => b.numero - a.numero);

  return { totalActividades, horasTotales, cargaTotal, pendientes, porEmpleado, porCategoria };
}
