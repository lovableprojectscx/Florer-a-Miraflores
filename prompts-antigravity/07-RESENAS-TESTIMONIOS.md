# PROMPT 07 — Página de reseñas y testimonios (P2, post-lanzamiento)

> Opción A del plan: testimonios curados, administrables desde el panel, + botón a Google. La API de Google Maps queda para después (P3).

---

Rama: `fase-07-resenas`.

## Alcance

- Ruta pública **`/resenas`** (y enlace en footer y, si Jack lo aprueba, en el menú): grilla de testimonios con foto (del cliente o del arreglo), nombre, distrito opcional, texto, estrellas 1–5, fecha. Destacados primero. Botón **"Ver nuestras reseñas en Google"** con el enlace que esté en `config` (nuevo campo `google_reviews_url`).
- Sección opcional en el home con 3 testimonios destacados (detrás de un toggle en config, apagada por defecto).
- Admin **`/admin/testimonios`**: CRUD completo con el mismo patrón que banners (upload a Storage en WebP con `src/lib/image-optimizer.ts`, toggle activo inline, destacar, reordenar con flechas ↑↓). Errores con toast.

## Base de datos (lo corre Jack)

`docs/sql/0XX-testimonios.sql`, idempotente y con reversa:
- Tabla `testimonios` (`id`, `nombre`, `distrito`, `texto`, `estrellas int check 1..5`, `imagen_url`, `fecha date`, `destacado bool`, `orden int`, `activo bool`, `created_at`).
- RLS: SELECT público solo `activo = true`; INSERT/UPDATE/DELETE solo admin, **con la misma condición de admin que usan las otras tablas** (cópiala de las policies existentes, no inventes otra).
- Columna `google_reviews_url text` en `config`.
- El front no puede romperse si la tabla todavía no existe: la sección se oculta y el admin muestra "Falta correr el SQL de testimonios".

## SEO

`<title>` "Reseñas | Florería Miraflores", meta description, y `AggregateRating` en JSON-LD **solo** si hay al menos 3 testimonios activos (con los datos reales, nada inventado).

## Tests

- Vitest: cálculo del promedio y conteo; validación del formulario (estrellas 1–5, texto mínimo).
- Playwright: `/resenas` carga sin errores en mobile/desktop y sin scroll horizontal; con 0 testimonios muestra un estado vacío digno; admin (con credenciales y `E2E_ALLOW_WRITES=1`): crear `[E2E] testimonio`, verlo en `/resenas`, borrarlo.
- RLS: anon no puede insertar en `testimonios`.

## Documentación

`docs/BASE-DE-DATOS.md`, `docs/REQUISITOS-FUNCIONALES.md` (nuevo RF), `docs/ACTUALIZACIONES.md`, guía corta para la encargada en `docs/GUIA-PANEL-TESTIMONIOS.md`.

**Importante:** no cargues testimonios inventados. Si hace falta contenido de ejemplo para probar, solo en tests con prefijo `[E2E]`.

Entrega el reporte del Prompt 00.
