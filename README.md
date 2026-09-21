# Control Semanal de Actividades

Reemplazo del Excel "ControlSemanalAct" — Fase 1: formulario de captura sin login
para los ingenieros + panel de control en vivo (login solo para ti).

**Stack:** Next.js 15 (App Router, TypeScript) + Tailwind CSS v4 + Supabase
(Postgres, Auth, RLS) + Vercel — el mismo combo que usas en NOVO, todo en capa
gratuita, sin comprar dominio todavía.

## 1. Crear el proyecto en Supabase (gratis)

1. Ve a [supabase.com](https://supabase.com) → **New project** (plan Free).
2. Cuando esté listo, entra a **SQL Editor → New query**, pega el contenido
   completo de [`supabase/schema.sql`](./supabase/schema.sql) y dale **Run**.
   Esto crea las tablas, la seguridad (RLS) y ya siembra el catálogo de 12
   actividades y los 4 ingenieros (Daniel, Carlos, Antonio, Jesús).
3. Ve a **Authentication → Users → Add user** y créate una cuenta a ti (el
   tío) con tu correo y una contraseña — esa es tu login para `/dashboard`.
   No actives "confirmar por correo" si quieres entrar de inmediato.
4. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

## 2. Configurar el proyecto localmente

```powershell
cd control-semanal
npm install
copy .env.local.example .env.local
```

Abre `.env.local` y pega tu `Project URL` y `anon public key` de Supabase.

```powershell
npm run dev
```

Abre `http://localhost:3000`:
- `/registro` — el formulario que van a usar los 4 ingenieros (sin login).
- `/dashboard` — el panel de control; te va a pedir el correo/contraseña que
  creaste en el paso 1.3.

## 3. Desplegar gratis (antes de comprar dominio)

1. Sube esta carpeta a un repo de GitHub (igual que hiciste con NOVO).
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el
   repo.
3. En **Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los mismos valores de tu `.env.local`.
4. Deploy. Te va a dar una URL gratis tipo `control-semanal.vercel.app` — esa
   es la que le compartes a tu tío y a los ingenieros mientras no haya
   dominio propio.

## Qué incluye esta Fase 1

- `/registro` — cualquier ingeniero elige su nombre de una lista y registra
  su actividad (fecha, horas, categoría, descripción, prioridad, estatus,
  evidencia, folio, comentarios). El tiempo y la carga ponderada se calculan
  solos en la base de datos, igual que las columnas J/K del Excel.
- `/dashboard` (protegido con login) — los mismos indicadores del Excel:
  actividades registradas, horas, carga ponderada, pendientes, comparativo
  por ingeniero, distribución por tipo de actividad y la actividad más
  reciente. Tiene navegación por semana (◀ / ▶), igual que el "Semana de
  control" del Excel.

## Qué falta para Fase 2 (según lo platicado)

El esquema (`supabase/schema.sql`) ya está listo para esto, solo falta la
pantalla:

- Una sección en `/dashboard` donde el tío pueda dar de alta/baja ingenieros
  y editar el catálogo de actividades (nombre, peso, evidencia requerida)
  sin tocar código ni pedírmelo a mí.

Aviso cuando quieras que sigamos con eso.

## Notas técnicas

- Las políticas RLS son las que hacen cumplir el modelo de permisos: cualquiera
  puede *insertar* actividades sin login, pero solo un usuario autenticado
  puede *leerlas* de vuelta (por eso `/dashboard` pide login). Está todo en
  `supabase/schema.sql`, sección "Seguridad (RLS)".
- El cálculo de minutos soporta actividades que cruzan medianoche, igual que
  la fórmula `MOD(C2-B2,1)*1440` del Excel original.
- Si agregas categorías nuevas directo en Supabase (Table editor), aparecen
  solas en el formulario — no hace falta tocar código.
