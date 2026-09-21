export type Prioridad = "BAJA" | "MEDIA" | "ALTA" | "CRÍTICA";

export type Estatus =
  | "PENDIENTE"
  | "EN PROCESO"
  | "FINALIZADO"
  | "FINALIZADO / RESTABLECIDO"
  | "CANCELADO"
  | "BLOQUEADO";

export type Evidencia = "SI" | "NO" | "NO APLICA";

export const PRIORIDADES: Prioridad[] = ["BAJA", "MEDIA", "ALTA", "CRÍTICA"];

export const ESTATUS: Estatus[] = [
  "PENDIENTE",
  "EN PROCESO",
  "FINALIZADO",
  "FINALIZADO / RESTABLECIDO",
  "CANCELADO",
  "BLOQUEADO",
];

export const EVIDENCIAS: Evidencia[] = ["SI", "NO", "NO APLICA"];

export interface Categoria {
  id: string;
  nombre: string;
  peso: number;
  evidencia_requerida: string | null;
  descripcion: string | null;
  objetivo: string | null;
  orden: number;
  activo: boolean;
}

export interface Empleado {
  id: string;
  nombre: string;
  activo: boolean;
  pin_hash?: string | null;
}

export interface Actividad {
  id: string;
  empleado_id: string;
  categoria_id: string | null;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  descripcion: string | null;
  unidad_ticket: string | null;
  prioridad: Prioridad;
  estatus: Estatus;
  evidencia: Evidencia;
  referencia_folio: string | null;
  comentarios: string | null;
  tiempo_min: number | null;
  carga_ponderada: number | null;
  creado_en: string;
  // presentes cuando se hace join con empleados/categorias
  empleados?: { nombre: string } | null;
  categorias?: { nombre: string } | null;
}
