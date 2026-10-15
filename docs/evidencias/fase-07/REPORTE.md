# Reporte — Fase 07: Reseñas y Testimonios (Opción D: Reseñas reales de Google elegidas a mano)

**Rama:** `fase-07-resenas`  
**Fecha:** 14 de Octubre de 2026  
**Estado:** ✅ APROBADO por el revisor — SQL 007 Ejecutado y Verificado

---

### Qué hice

1. **Base de Datos y Migración SQL (`docs/sql/007-testimonios.sql`)**:
   - Diseñado script SQL 100% idempotente con `IF NOT EXISTS` / `DO $$`.
   - Creación de tabla `testimonios` con los nombres de columna oficiales: `id`, `nombre`, `texto`, `estrellas` (1-5 con `CHECK`), `fecha` (`date`), `fuente` (`google`, `whatsapp`, `facebook`, `directo`), `enlace_original` (`text`), `imagen_url` (`text`), `destacado` (`boolean default false`), `orden` (`integer default 0`), `activo` (`boolean default true`), `created_at` (`timestamptz default now()`).
   - Políticas RLS seguras: lectura anónima pública restringida a `activo = true`, escrituras (INSERT, UPDATE, DELETE) exclusivas para administradores autenticados (`is_admin()`).
   - Bucket público en Supabase Storage: `testimonios` con políticas de lectura pública y escritura solo admin.
   - Columnas añadidas a la tabla existente `config`: `google_reviews_url` (`text`), `google_rating` (`numeric(2,1)`), `google_reviews_count` (`int`), `mostrar_resenas_home` (`bool default false`).
   - Consultas de verificación automáticas y bloque de reversa (`ROLLBACK`) documentado y comentado.
   - **Ejecución de migración**: aplicada con éxito mediante `apply_migration` (`007_testimonios`) en el proyecto `sdrkiomeesoctsxeidmu` tras recibir aprobación explícita de Jack.

2. **Tipos TypeScript y Modelado (`src/types/database.ts`)**:
   - Definidos tipos `TestimonioRow`, `TestimonioInsert`, `TestimonioUpdate`, `TestimonioFuente` ('google' | 'whatsapp' | 'facebook' | 'directo').
   - Actualizados `ConfigRow`, `ConfigUpdate` y `Database['public']['Tables']` para garantizar tipado estricto en toda la aplicación.

3. **Módulo de Utilidades Puras (`src/lib/resenas-utils.ts`)**:
   - `validarTestimonioForm`: validación sin dependencias externas (nombre obligatorio <=100 chars, texto/comentario obligatorio 10-2000 chars, estrellas entero 1-5, URLs válidas con https).
   - `formatRating`: formato numérico regional con coma en español (ej. `4,9`).
   - `formatGoogleSummary`: generación de texto resumen ("4,9 de 5 según 128 opiniones en Google").
   - `shouldShowHomeTestimonios`: lógica pura de visibilidad en el Home (`mostrar_resenas_home = true` Y al menos 3 testimonios activos).

4. **Capa de Consultas con Fallback Estricto (`src/lib/queries.ts`)**:
   - Implementadas `getTestimonios()` (todos los activos ordenados por destacado desc, orden asc, created_at desc) y `getTestimoniosHome()`.
   - **Ajuste de fallback según revisión**: se activa **única y exclusivamente** si el error reporta código `42P01` (tabla inexistente en Postgres) o `PGRST205` (tabla no encontrada en cache PostgREST). Se eliminó cualquier coincidencia genérica por texto (`includes("testimonios")`); cualquier otro error de red, auth o sintaxis se lanza normalmente.

5. **Componentes Públicos**:
   - `src/components/ResenaCard.tsx`: Tarjeta con estrellas SVG doradas, badge de origen (icono Google oficial en SVG, WhatsApp, Facebook, Directo/Cliente verificado), truncado tipográfico a ~6 líneas con botón interactivo "Leer más / Leer menos" y modal lightbox para foto adjunta opcional.
   - `src/components/HomeTestimonios.tsx`: Carrusel horizontal con scroll-snap táctil, botones anterior/siguiente, encabezado editorial y resumen de Google con enlace directo a Maps. Ocultamiento automático si no cumple la regla de visibilidad.
   - `src/routes/resenas.tsx`: Página pública `/resenas` con badge destacado de Google, botón "Ver todas en Google", cuadrícula responsive (1 col móvil, 2 tablet, 3 desktop), estado vacío digno y meta tags SEO completos (sin JSON-LD engañoso).
   - `src/routes/index.tsx`: Montado `<HomeTestimonios />` entre `CategoryShowcase` y `DeliveryZones`.
   - `src/components/Footer.tsx`: Enlace a "Reseñas" bajo "Sobre Nosotros" (sin modificar el header).
   - `scripts/generate-sitemap.mjs`: Añadida URL `/resenas` con prioridad 0.8 y frecuencia semanal.

6. **Panel Administrativo CRUD (`src/routes/admin/testimonios.tsx` & `src/routes/admin.tsx`)**:
   - Nueva sección "Testimonios" (ícono `Star`) en el sidebar administrativo.
   - Lista con ordenamiento interactivo (flechas ↑ / ↓), toggles de `destacado` y `activo` en un solo clic.
   - Modal de creación y edición: selector de estrellas 1 a 5, selector de fuente (`google`, `whatsapp`, `facebook`, `directo`), subida de foto WebP optimizada con miniaturas.
   - **Advertencia obligatoria de autenticidad**: _"Copia la reseña tal cual aparece en Google. No la edites ni inventes reseñas."_
   - Bloque de configuración del resumen de Google con preview en tiempo real.
   - Modal de confirmación propio para eliminación (sin `window.confirm`).

7. **Pruebas y Evidencias**:
   - `tests/unit/resenas-utils.test.ts`: 16 pruebas unitarias pasando al 100%.
   - `tests/rls/rls.test.ts`: Prueba de seguridad RLS verificando bloqueo de inserción anónima.
   - `tests/e2e/resenas.spec.ts`: Suite E2E completa (8 passed, 2 skipped controlados) en móvil y escritorio.
   - `tests/e2e/admin.spec.ts`: Actualizado para verificar la presencia y navegación a Testimonios en el panel admin.
   - Capturas de pantalla tomadas a 390px y 1440px en `docs/evidencias/fase-07/`.

8. **Documentación**:
   - `docs/BASE-DE-DATOS.md`: Sección 10 completa con esquemas, RLS y storage.
   - `docs/REQUISITOS-FUNCIONALES.md`: RF-100 a RF-104.
   - `docs/ACTUALIZACIONES.md`: Entrada de versión v1.10.0.
   - `docs/GUIA-PANEL-TESTIMONIOS.md`: Guía ilustrativa paso a paso para Sofía.

---

### Verificación SQL 007 Ejecutado (SELECT DESPUÉS)

Tras la aprobación de Jack ("SQL 007 aprobado por el revisor"), la migración fue aplicada exitosamente en Supabase. A continuación los resultados reales de las 4 consultas de verificación ejecutadas por MCP:

#### 1. Columnas de `public.testimonios`:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'testimonios'
ORDER BY ordinal_position;
```

**Resultado real devuelto:**

| column_name       | data_type                | is_nullable | column_default      |
| :---------------- | :----------------------- | :---------- | :------------------ |
| `id`              | uuid                     | NO          | `gen_random_uuid()` |
| `nombre`          | text                     | NO          | _null_              |
| `texto`           | text                     | NO          | _null_              |
| `estrellas`       | integer                  | NO          | _null_              |
| `fecha`           | date                     | YES         | _null_              |
| `fuente`          | text                     | NO          | `'google'::text`    |
| `enlace_original` | text                     | YES         | _null_              |
| `imagen_url`      | text                     | YES         | _null_              |
| `destacado`       | boolean                  | NO          | `false`             |
| `orden`           | integer                  | NO          | `0`                 |
| `activo`          | boolean                  | NO          | `true`              |
| `created_at`      | timestamp with time zone | NO          | `now()`             |

#### 2. Columnas añadidas en `public.config`:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'config' AND column_name IN ('google_reviews_url', 'google_rating', 'google_reviews_count', 'mostrar_resenas_home')
ORDER BY ordinal_position;
```

**Resultado real devuelto:**

| column_name            | data_type |
| :--------------------- | :-------- |
| `google_reviews_url`   | text      |
| `google_rating`        | numeric   |
| `google_reviews_count` | integer   |
| `mostrar_resenas_home` | boolean   |

#### 3. Políticas RLS en `public.testimonios`:

```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'testimonios'
ORDER BY policyname;
```

**Resultado real devuelto:**

| policyname                | cmd    | roles             | qual                              | with_check   |
| :------------------------ | :----- | :---------------- | :-------------------------------- | :----------- |
| `Admin Write testimonios` | ALL    | `{authenticated}` | `is_admin()`                      | `is_admin()` |
| `Public Read testimonios` | SELECT | `{public}`        | `((activo = true) OR is_admin())` | _null_       |

#### 4. Bucket y Políticas en Supabase Storage:

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'testimonios';
SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%testimonios%' ORDER BY policyname;
```

**Resultado real devuelto:**

- **Bucket:** `[{"id":"testimonios","name":"testimonios","public":true}]`
- **Políticas de objetos:**
  - `admin puede actualizar testimonios` (UPDATE)
  - `admin puede eliminar testimonios` (DELETE)
  - `admin puede subir testimonios` (INSERT)
  - `lectura publica de testimonios` (SELECT)

---

### Declaración de `git restore` realizados (Justificación de descartes)

Durante el ciclo de desarrollo y pruebas en el worktree `floreria-resenas`, se descartaron mediante `git restore` modificaciones en los siguientes archivos no pertenecientes a la Fase 07:

1. `tests/e2e/orden-movil.spec.ts`, `scripts/capturar-carrusel-local.mjs`, `scripts/capturar-carrusel-vercel.mjs`, `docs/CERTIFICACION-LANZAMIENTO.md`:
   - **Motivo del restore:** Al correr formateadores (`prettier` / `eslint --fix`), estos archivos sufrieron cambios puramente cosméticos (reparto de saltos de línea en templates y llamadas). Fueron restaurados al estado exacto de `origin/master` para evitar diffs ruidosos y mantener el historial enfocado 100% en la Fase 07.
2. `docs/evidencias/fase-01/` y `docs/evidencias/fase-06b/`:
   - **Motivo del restore:** Se regeneraron capturas temporales durante pruebas de regresión visual de fases anteriores. Se descartaron para conservar las evidencias históricas auditadas oficiales.
3. `playwright.config.ts`:
   - **Motivo del restore:** Se configuró localmente con `PORT=8081` para levantar el dev server en un puerto aislado y no interferir con la otra conversación que corre en paralelo en el puerto `8080`. Se restauró a `8080` antes de confirmar el commit para respetar la instrucción expresa: _"no hagas commit de ese cambio de puerto"_.

---

### Evidencia Técnica

#### 1. Pipeline de Verificación (`npm run verify`)

Archivo guardado en: [`docs/evidencias/fase-07/verify.txt`](file:///docs/evidencias/fase-07/verify.txt)

```text
> verify
> npm run lint && npm run typecheck && npm run test && npm run build

> lint
> eslint .
✖ 8 problems (0 errors, 8 warnings)

> typecheck
> tsc --noEmit

> test
> vitest run
 Test Files  11 passed (11)
      Tests  104 passed (104)
   Start at  22:13:12
   Duration  10.01s

> build
> vite build
✓ 2207 modules transformed.
✓ built in 7.87s
vite v7.3.3 building ssr environment for production...
✓ built in 7.31s

> postbuild
> node scripts/postbuild.js
Postbuild: Copied dist/client files to dist/
Postbuild: Created dist/server/server.js for preview compatibility
```

#### 2. Suite Completa E2E Playwright (`npm run test:e2e`)

Archivo guardado en: [`docs/evidencias/fase-07/e2e.txt`](file:///docs/evidencias/fase-07/e2e.txt)

```text
Running 86 tests using 1 worker

  ... (todos los tests pasaron exitosamente) ...
  ok 72 [desktop] › tests\e2e\resenas.spec.ts:15:3 › Fase 07 — Reseñas y Testimonios E2E › Página pública /resenas carga sin errores, con título correcto y sin scroll horizontal (1.2s)
  ok 73 [desktop] › tests\e2e\resenas.spec.ts:54:3 › Fase 07 — Reseñas y Testimonios E2E › Footer contiene enlace a /resenas y navega correctamente (2.2s)
  ok 74 [desktop] › tests\e2e\resenas.spec.ts:62:3 › Fase 07 — Reseñas y Testimonios E2E › Home: la franja de testimonios respeta la regla de visibilidad (2.2s)
  ok 75 [desktop] › tests\e2e\resenas.spec.ts:79:3 › Fase 07 — Reseñas y Testimonios E2E › Admin /admin/testimonios: carga panel de gestión y formulario (22.8s)
  -  76 [desktop] › tests\e2e\resenas.spec.ts:152:3 › Fase 07 — Reseñas y Testimonios E2E › Admin CRUD: solo con E2E_ALLOW_WRITES=1 crea y elimina '[E2E] testimonio'
  ...
  ok 86 [desktop] › tests\e2e\thumbnails.spec.ts:155:3 › Miniaturas y Responsive Images E2E (Fase 06-B) › Banner Hero: en desktop 1440 carga original sin /thumbs/, en mobile 390 carga sin errores (Fase 06-C) (2.2s)

  8 skipped
  78 passed (4.7m)
```

#### 3. Capturas de Pantalla Generadas

- [`docs/evidencias/fase-07/resenas-390.png`](file:///docs/evidencias/fase-07/resenas-390.png): Página `/resenas` en celular 390px (sin scroll horizontal, diseño limpio).
- [`docs/evidencias/fase-07/resenas-1440.png`](file:///docs/evidencias/fase-07/resenas-1440.png): Página `/resenas` en escritorio 1440px (grilla editorial de 3 columnas).
- [`docs/evidencias/fase-07/admin-testimonios-desktop.png`](file:///docs/evidencias/fase-07/admin-testimonios-desktop.png): Panel administrativo `/admin/testimonios` con resumen de Google y formulario.

---

### Lo que NO hice o quedó a medias (y por qué)

1. **NO se insertaron reseñas inventadas o ficticias**:
   - Se respeta la política de autenticidad: las reseñas deben ser seleccionadas y copiadas directamente desde el perfil real de Google Maps por Sofía o Jack.
2. **NO se incluyó JSON-LD `AggregateRating` / `Review` en el head**:
   - Google sanciona manualmente sitios que marcan reseñas seleccionadas manualmente como si fueran recolectadas por un sistema abierto de reviews. Se mantuvo SEO limpio con OpenGraph y Twitter cards estándar.
3. **NO se tocó el menú principal del header**:
   - El enlace público se situó exclusivamente en el Footer bajo "Sobre Nosotros".
4. **NO se hizo merge a master ni push a master**:
   - En espera de la instrucción final de Jack ("ya puedes integrar") para hacer git fetch, rebase/merge con origin/master, la batería completa de verificación una vez, y merge/push final a master.

---

### Acciones para Jack / Sofía

1. **Configuración en el Panel Admin (`/admin/testimonios`)**:
   - Ya que el SQL 007 está aplicado y activo, ingresar a `/admin/testimonios`.
   - Llenar los datos del resumen de Google:
     - URL de Google Maps (enlace al perfil de Florería Miraflores).
     - Rating (ej. `4.9`).
     - Cantidad de reseñas (ej. `128`).
   - Copiar de 3 a 5 reseñas reales destacadas desde Google Maps y guardarlas.
   - Encender el switch _"Mostrar franja de testimonios en la página de inicio (Home)"_.
2. **Capacitación para Sofía**:
   - Compartir [`docs/GUIA-PANEL-TESTIMONIOS.md`](file:///docs/GUIA-PANEL-TESTIMONIOS.md) con la encargada.
3. **Integración**:
   - Indicar cuando la otra conversación haya finalizado para ejecutar la integración final a `master`.
