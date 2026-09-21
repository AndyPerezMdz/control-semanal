import crypto from "crypto";

const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;

export const SESSION_COOKIE = "ingeniero_sesion";
export const SESSION_MAX_AGE_SEG = OCHO_HORAS_MS / 1000;

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    throw new Error("Falta la variable de entorno SESSION_SECRET.");
  }
  return s;
}

function firmar(payload: string): string {
  return crypto.createHmac("sha256", secreto()).update(payload).digest("hex");
}

/** Crea el valor de la cookie de sesión para un ingeniero ya verificado por PIN. */
export function crearTokenSesion(empleadoId: string): string {
  const exp = Date.now() + OCHO_HORAS_MS;
  const payload = `${empleadoId}.${exp}`;
  return `${payload}.${firmar(payload)}`;
}

/**
 * Verifica el token de la cookie: firma válida y no expirado.
 * Devuelve el empleado_id si es válido, o null si no.
 */
export function verificarTokenSesion(token: string | undefined | null): string | null {
  if (!token) return null;

  const partes = token.split(".");
  if (partes.length !== 3) return null;

  const [empleadoId, expStr, firma] = partes;
  const exp = Number(expStr);
  if (!empleadoId || !exp || !firma || Number.isNaN(exp)) return null;
  if (Date.now() > exp) return null;

  const payload = `${empleadoId}.${expStr}`;
  const firmaEsperada = firmar(payload);

  const a = Buffer.from(firma);
  const b = Buffer.from(firmaEsperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return empleadoId;
}
