import type { Estatus, Prioridad } from "@/lib/types";

const ESTATUS_STYLE: Record<Estatus, { fg: string; bg: string }> = {
  PENDIENTE: { fg: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  "EN PROCESO": { fg: "var(--accent)", bg: "var(--status-neutral-bg)" },
  FINALIZADO: { fg: "var(--status-good)", bg: "var(--status-good-bg)" },
  "FINALIZADO / RESTABLECIDO": { fg: "var(--status-good)", bg: "var(--status-good-bg)" },
  CANCELADO: { fg: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  BLOQUEADO: { fg: "var(--status-critical)", bg: "var(--status-critical-bg)" },
};

const PRIORIDAD_STYLE: Record<Prioridad, { fg: string; bg: string }> = {
  BAJA: { fg: "var(--status-neutral)", bg: "var(--status-neutral-bg)" },
  MEDIA: { fg: "var(--accent)", bg: "var(--status-neutral-bg)" },
  ALTA: { fg: "var(--status-warning)", bg: "var(--status-warning-bg)" },
  "CRÍTICA": { fg: "var(--status-critical)", bg: "var(--status-critical-bg)" },
};

function Badge({ label, fg, bg }: { label: string; fg: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ color: fg, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}

export function EstatusBadge({ estatus }: { estatus: Estatus }) {
  const s = ESTATUS_STYLE[estatus] ?? ESTATUS_STYLE.PENDIENTE;
  return <Badge label={estatus} fg={s.fg} bg={s.bg} />;
}

export function PrioridadBadge({ prioridad }: { prioridad: Prioridad }) {
  const s = PRIORIDAD_STYLE[prioridad] ?? PRIORIDAD_STYLE.MEDIA;
  return <Badge label={prioridad} fg={s.fg} bg={s.bg} />;
}
