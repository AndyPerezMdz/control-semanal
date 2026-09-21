import { cerrarSesion } from "@/app/login/actions";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)] transition hover:bg-[var(--surface-muted)]"
      >
        <LogOut size={14} />
        Salir
      </button>
    </form>
  );
}
