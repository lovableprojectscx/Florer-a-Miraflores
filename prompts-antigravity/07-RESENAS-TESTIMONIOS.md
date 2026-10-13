# PROMPT 07 — Reseñas (opción D: reseñas reales de Google elegidas a mano)

> Decisión de Jack (13-10-2026): reseñas reales copiadas a mano desde Google al admin + botón "Ver todas en Google".
> NADA de scraping ni widgets externos. La API oficial de Google queda para más adelante.
> Reglas del 00 vigentes (SQL: mostrar, esperar "SQL 007 aprobado por el revisor", ejecutar por MCP, pegar después).

Rama: `fase-07-resenas` desde master actualizado.

## 0. Lectura previa (solo lectura, pega salidas crudas)
- Estructura real de la tabla de configuración (`config` o como se llame): columnas y tipos.
- Las policies actuales de una tabla de catálogo (ej. `banners`) para copiar EXACTAMENTE la condición de admin (`is_admin()`).

## 1. Base de datos — `docs/sql/007-testimonios.sql` (idempotente, con bloque de reversa comentado)
Tabla `testimonios`:
- `id uuid pk default gen_random_uuid()`
- `nombre text not null` (como aparece en Google, ej. "María P.")
- `texto text not null` (copiado TAL CUAL, sin editar)
- `estrellas int not null check (estrellas between 1 and 5)`
- `fecha date` (fecha de la reseña original)
- `fuente text not null default 'google' check (fuente in ('google','whatsapp','facebook','directo'))`
- `enlace_original text` (opcional)
- `imagen_url text` (opcional: foto del arreglo entregado)
- `destacado bool default false`, `orden int default 0`, `activo bool default true`, `created_at timestamptz default now()`

RLS: SELECT público solo `activo = true`; INSERT/UPDATE/DELETE solo `is_admin()` (misma forma que las demás tablas).
Columnas nuevas en la tabla de configuración:
- `google_reviews_url text`, `google_rating numeric(2,1)`, `google_reviews_count int`, `mostrar_resenas_home bool default false`.
Bucket de Storage: reutiliza el existente que corresponda o crea `testimonios` con policies de escritura `is_admin()` (igual que `banners`). Dilo explícitamente.

## 2. Página pública `/resenas`
- Encabezado: "Lo que dicen nuestros clientes" + resumen real desde config: "★ 4,9 · 120 reseñas en Google" (solo si google_rating y google_reviews_count tienen valor; si no, no se muestra nada inventado).
- Botón "Ver todas en Google" → `google_reviews_url` (target _blank, rel noopener). Si está vacío, no se muestra.
- Grilla de tarjetas: estrellas, texto (cortar a ~6 líneas con "Leer más"), nombre, fecha, icono pequeño de la fuente, foto si hay. Destacados primero, luego `orden`.
- Estado vacío digno si hay 0.
- Mismo estilo visual del sitio (tipografías, colores, bordes de las tarjetas de Novedades).

## 3. Franja en el home
- Debajo de las Colecciones: 3–6 reseñas destacadas en carrusel horizontal (mismo patrón borde a borde de Novedades) + enlace "Ver todas las reseñas" → `/resenas`.
- Solo aparece si `mostrar_resenas_home = true` Y hay al menos 3 activas.

## 4. Enlaces
- Footer: "Reseñas". NO tocar el menú principal del header.

## 5. Admin `/admin/testimonios` (en el menú lateral del admin)
- CRUD con el mismo patrón que banners: toggle activo, destacar, reordenar ↑↓, toasts de error/éxito.
- Formulario: nombre, texto, estrellas (selector de 1 a 5 visual), fecha, fuente, enlace original, foto opcional (subida con `subirImagenConMiniaturas`).
- Bloque "Resumen de Google" en la misma pantalla: editar `google_reviews_url`, `google_rating`, `google_reviews_count` y el toggle `mostrar_resenas_home`.
- Aviso fijo en el formulario: "Copia la reseña tal cual aparece en Google. No la edites ni inventes reseñas."
- Si la tabla aún no existe: mensaje "Falta correr el SQL 007", sin romper el admin.

## 6. SEO
- `<title>` "Reseñas | Florería Miraflores" y meta description.
- **NO** agregar JSON-LD `AggregateRating` ni `Review`: Google no permite marcado de reseñas elegidas por el propio negocio.
- Agregar `/resenas` al sitemap.

## 7. Tests
- Vitest: validación del formulario (estrellas 1–5, texto mínimo 10 caracteres, nombre obligatorio); formato del resumen ("4,9" con coma); regla de visibilidad de la franja del home (toggle + mínimo 3).
- Playwright: `/resenas` carga sin errores en mobile y desktop, sin scroll horizontal; estado vacío; la franja del home no aparece con el toggle apagado. CRUD de admin solo con `E2E_ALLOW_WRITES=1` usando `[E2E] testimonio` y borrándolo al final.
- RLS: anon NO puede insertar en `testimonios` (exigir 42501).

## 8. Documentación
`docs/BASE-DE-DATOS.md`, `docs/REQUISITOS-FUNCIONALES.md`, `docs/ACTUALIZACIONES.md` y `docs/GUIA-PANEL-TESTIMONIOS.md` (guía para Sofía/encargada: cómo copiar una reseña de Google paso a paso, con capturas).

**Prohibido** cargar reseñas inventadas en producción. Datos de ejemplo solo en tests con prefijo `[E2E]`.

## Cierre
verify + E2E completos guardados en archivo, capturas de `/resenas` (390 y 1440) y del admin, merge a master, push, y captura de la web real DESPUÉS de confirmar que el deploy terminó (verifica tú la captura antes de describirla).
Reporte con el formato del 00.
