"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { registrarActividad, type RegistrarActividadState } from "@/app/registro/actions";
import { ESTATUS, EVIDENCIAS, PRIORIDADES, type Categoria, type Empleado } from "@/lib/types";

const initialState: RegistrarActividadState = { ok: false };

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";

const labelClass = "mb-1 block text-sm font-medium text-[var(--ink-secondary)]";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Guardar actividad"}
    </button>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ActivityForm({
  empleados,
  categorias,
}: {
  empleados: Empleado[];
  categorias: Categoria[];
}) {
  const [state, formAction] = useActionState(registrarActividad, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok]);

  return (
    <div className="flex flex-col gap-4">
      {state.ok && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-good)]/30 bg-[var(--status-good-bg)] px-3 py-2 text-sm text-[var(--status-good)]">
          <CheckCircle2 size={16} />
          Actividad guardada. Puedes registrar otra.
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-critical)]/30 bg-[var(--status-critical-bg)] px-3 py-2 text-sm text-[var(--status-critical)]">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="empleado_id">
            Tu nombre
          </label>
          <select id="empleado_id" name="empleado_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona tu nombre
            </option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="pin">
            Tu PIN (4 dígitos)
          </label>
          <input
            type="password"
            id="pin"
            name="pin"
            required
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            placeholder="••••"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="fecha">
              Fecha
            </label>
            <input type="date" id="fecha" name="fecha" required defaultValue={today()} className={inputClass} />
          </div>
          <div />
          <div>
            <label className={labelClass} htmlFor="hora_inicio">
              Hora inicio
            </label>
            <input type="time" id="hora_inicio" name="hora_inicio" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="hora_fin">
              Hora fin
            </label>
            <input type="time" id="hora_fin" name="hora_fin" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="categoria_id">
            Categoría de actividad
          </label>
          <select id="categoria_id" name="categoria_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona una categoría
            </option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="descripcion">
            Descripción / detalle
          </label>
          <textarea id="descripcion" name="descripcion" rows={3} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="unidad_ticket">
            Unidad / ticket / lugar
          </label>
          <input type="text" id="unidad_ticket" name="unidad_ticket" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="prioridad">
              Prioridad
            </label>
            <select id="prioridad" name="prioridad" defaultValue="MEDIA" className={inputClass}>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="estatus">
              Estatus
            </label>
            <select id="estatus" name="estatus" defaultValue="PENDIENTE" className={inputClass}>
              {ESTATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="evidencia">
              ¿Hay evidencia?
            </label>
            <select id="evidencia" name="evidencia" defaultValue="NO" className={inputClass}>
              {EVIDENCIAS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="referencia_folio">
              Referencia / folio
            </label>
            <input type="text" id="referencia_folio" name="referencia_folio" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="comentarios">
            Comentarios / bloqueo
          </label>
          <textarea id="comentarios" name="comentarios" rows={2} className={inputClass} />
        </div>

        <SubmitButton />
      </form>
    </div>
  );
}
