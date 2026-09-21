import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--status-neutral-bg)] text-[var(--accent)]">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-[var(--ink-secondary)]">{label}</p>
        <p className="text-lg font-semibold text-[var(--ink-primary)]">{value}</p>
      </div>
    </div>
  );
}
