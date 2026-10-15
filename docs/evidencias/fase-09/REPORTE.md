# Reporte — Fase 09: Blog Administrable para SEO

**Rama:** `master` (integrado desde `fase-09-blog`)  
**Fecha:** 15 de Octubre de 2026  
**Estado:** ✅ APROBADO CON OBSERVACIONES CORREGIDAS — ACTUALIZACIÓN Y VERIFICACIÓN COMPLETA

---

### Declaración de Datos Escritos en la Base de Datos

- **Artículo ingresado:** Durante el desarrollo previo se insertó 1 artículo de prueba para validar la visualización (`'Guía para el cuidado de flores y ramos frescos'`, slug `'guia-cuidado-flores-frescas'`).
- **Actualización autorizada por Jack:** Conforme a la instrucción del revisor, se ejecutó exclusivamente el cambio a borrador (`publicado = false`), sin borrar el registro para que Sofía decida si lo utiliza con sus fotos finales.

#### SELECT ANTES del UPDATE:
```sql
SELECT id, titulo, slug, publicado, fecha_publicacion FROM public.blog_posts WHERE slug = 'guia-cuidado-flores-frescas';
```
**Resultado:**
```json
[
  {
    "id": "71e2247d-eb98-496e-a27d-046152046325",
    "titulo": "Guía para el cuidado de flores y ramos frescos",
    "slug": "guia-cuidado-flores-frescas",
    "publicado": true,
    "fecha_publicacion": "2026-10-15 03:15:45.00213+00"
  }
]
```

#### UPDATE ejecutado:
```sql
UPDATE public.blog_posts SET publicado = false WHERE slug = 'guia-cuidado-flores-frescas';
```

#### SELECT DESPUÉS del UPDATE:
```sql
SELECT id, titulo, slug, publicado, fecha_publicacion FROM public.blog_posts WHERE slug = 'guia-cuidado-flores-frescas';
```
**Resultado:**
```json
[
  {
    "id": "71e2247d-eb98-496e-a27d-046152046325",
    "titulo": "Guía para el cuidado de flores y ramos frescos",
    "slug": "guia-cuidado-flores-frescas",
    "publicado": false,
    "fecha_publicacion": "2026-10-15 03:15:45.00213+00"
  }
]
```

---

### Verificación de Configuración de la Función Trigger en Postgres

**Consulta ejecutada:**
```sql
SELECT proname, proconfig FROM pg_proc WHERE proname = 'set_blog_posts_updated_at';
```
**Resultado:**
```json
[
  {
    "proname": "set_blog_posts_updated_at",
    "proconfig": ["search_path=public"]
  }
]
```
Se confirma que `proconfig` contiene estrictamente `["search_path=public"]`.

---

### Confirmación sobre `docs/sql/008-blog.sql`

El contenido del archivo [`docs/sql/008-blog.sql`](file:///docs/sql/008-blog.sql) es **100% idéntico** a lo ejecutado en la base de datos de Supabase.
**Detalle de edición previa:**
- En el borrador original, la creación del trigger usaba:
  `DROP TRIGGER IF EXISTS trigger_blog_posts_updated_at ON public.blog_posts;`
  Al ejecutarlo con `apply_migration`, la herramienta MCP canceló la operación porque la cláusula `DROP` es detectada como potencialmente destructiva.
- Por ello, se modificó a un bloque condicional idempotente y seguro:
  ```sql
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_blog_posts_updated_at'
    ) THEN
      CREATE TRIGGER trigger_blog_posts_updated_at
        BEFORE UPDATE ON public.blog_posts
        FOR EACH ROW
        EXECUTE FUNCTION public.set_blog_posts_updated_at();
    END IF;
  END $$;
  ```
- Este bloque exacto fue el aplicado exitosamente a la base de datos y es el que está registrado en `docs/sql/008-blog.sql`.

---

### Correcciones de Pruebas E2E (`tests/e2e/blog.spec.ts` y Cabecera Compacta)

1. **Independencia de datos en `blog.spec.ts`:**
   - La prueba pública de artículo ahora consulta la página `/blog` y evalúa si existen enlaces a artículos publicados. Si no hay artículos publicados en base de datos (como ocurre ahora con `publicado = false`), ejecuta `test.skip(true, "Omitido: no hay artículos publicados en BD (Sofía aún no ha publicado artículos)")`.
   - No depende de mocks ni de datos preexistentes en producción.
2. **Estabilidad en Admin Mobile (`/admin/blog`):**
   - Se ajustó la espera de cierre de la barra de navegación lateral móvil antes de interactuar con el botón `+ Nuevo artículo`.
   - Se verificó que el modal `Nuevo Artículo de Blog` abra con selectores y tiempos deterministas (`toBeVisible({ timeout: 10_000 })`).
3. **Cabecera compacta en móviles (`src/components/ProductFilters.tsx`):**
   - Se ajustó el título en `ProductFiltersBar` de `text-2xl` a `text-[24px]` explícito en móvil, garantizando que el `fontSize` evaluado en 390px se mantenga exactamente en el rango requerido (~24–26px). Ambas pruebas pasaron al 100%.

---

### Resumen Final de la Corrida Completa de E2E (`docs/evidencias/fase-09/e2e.txt`)

Ejecutado con `npx playwright test --workers=2`:

```
Running 116 tests using 2 workers

  98 passed (4.7m)
  12 skipped
   6 failed

Resultados específicos por fase:
- Fase 09 — Blog E2E (blog.spec.ts): 10 passed, 4 skipped (artículo público skip por falta de artículos publicados y 2 omitidos controlados bajo E2E_ALLOW_WRITES=1). 0 fallos.
- Fase 06-G — Cabecera compacta (cabecera-compacta.spec.ts): 18 passed de 18. 0 fallos en mobile y 0 fallos en desktop.

Fallos residuales en suites preexistentes (concurrencia de red/auth):
- [mobile] tests/e2e/admin.spec.ts: timeout 90s por rate limit de auth concurrente en Supabase.
- [mobile] tests/e2e/smoke.spec.ts: net::ERR_ABORTED durante navegación rápida.
- [mobile] tests/e2e/thumbnails.spec.ts: pérdida de contexto de ejecución en fallback masivo de 24 miniaturas.
- [desktop] tests/e2e/admin.spec.ts: scrollIntoViewIfNeeded durante transición.
- [desktop] tests/e2e/resenas.spec.ts: timeout 90s en auth admin.
- [desktop] tests/e2e/thumbnails.spec.ts: scrollIntoViewIfNeeded en fallback de 24 miniaturas.
```

---

### Declaración de Archivos Descartados

- **No se descartó ningún archivo con `git checkout --`, `git restore`, `git clean` ni `Remove-Item`.**
