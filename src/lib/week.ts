/** Devuelve el lunes y domingo (YYYY-MM-DD) de la semana que contiene `dateStr`. */
export function getWeekRange(dateStr?: string) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const day = base.getDay(); // 0 = domingo, 1 = lunes, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(base);
  monday.setDate(base.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return { desde: fmt(monday), hasta: fmt(sunday) };
}

export function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatFechaLarga(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
