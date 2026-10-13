-- =============================================================================
-- docs/sql/diagnostico-categorias.sql
-- Diagnóstico de categorías, productos, policies RLS y constraints (SOLO LECTURA)
--
-- PROPÓSITO:
--   Ejecutar en el SQL Editor de Supabase (rol postgres) para inspeccionar
--   TODAS las filas de `categorias` y `productos` (incluidas las inactivas que
--   la policy de anon oculta), así como las policies RLS y los constraints de
--   la tabla `categorias`.
--
-- SEGURIDAD / REVERSIÓN:
--   Este archivo contiene ÚNICAMENTE sentencias SELECT. No modifica datos ni
--   esquema, por lo que no requiere script de reversión.
-- =============================================================================

-- 1. Todas las filas de `categorias` (activas e inactivas) con el nombre de su padre
SELECT
  c.id,
  c.nombre,
  c.slug,
  c.activo,
  c.orden,
  c.parent_id,
  p.nombre AS parent_nombre,
  p.slug   AS parent_slug,
  c.imagen_url,
  c.created_at
FROM public.categorias c
LEFT JOIN public.categorias p ON p.id = c.parent_id
ORDER BY
  COALESCE(p.orden, c.orden) ASC,
  c.parent_id NULLS FIRST,
  c.orden ASC,
  c.nombre ASC;

-- 2. Conteo de productos por categoría (activos, inactivos y total), incluyendo categorías con 0 productos
SELECT
  c.id          AS categoria_id,
  p.nombre      AS padre_nombre,
  c.nombre      AS categoria_nombre,
  c.slug        AS categoria_slug,
  c.activo      AS categoria_activa,
  COUNT(pr.id) FILTER (WHERE pr.activo = true)  AS productos_activos,
  COUNT(pr.id) FILTER (WHERE pr.activo = false) AS productos_inactivos,
  COUNT(pr.id)                                  AS productos_total
FROM public.categorias c
LEFT JOIN public.categorias p  ON p.id = c.parent_id
LEFT JOIN public.productos  pr ON pr.categoria_id = c.id
GROUP BY c.id, p.nombre, p.orden, c.nombre, c.slug, c.activo, c.parent_id, c.orden
ORDER BY
  COALESCE(p.orden, c.orden) ASC,
  c.parent_id NULLS FIRST,
  c.orden ASC,
  c.nombre ASC;

-- 3. Productos sin categoría asignada (categoria_id IS NULL) o apuntando a categoría inexistente
SELECT
  pr.id,
  pr.nombre,
  pr.precio,
  pr.activo,
  pr.categoria_id
FROM public.productos pr
LEFT JOIN public.categorias c ON c.id = pr.categoria_id
WHERE pr.categoria_id IS NULL OR c.id IS NULL
ORDER BY pr.activo DESC, pr.nombre ASC;

-- 4. Políticas RLS activas en `categorias` y `productos`
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('categorias', 'productos')
ORDER BY tablename ASC, cmd ASC, policyname ASC;

-- 5. Constraints (PK, FK, UNIQUE, CHECK) definidos sobre `categorias`
SELECT
  con.conname                                    AS constraint_name,
  con.contype                                    AS constraint_type,
  pg_get_constraintdef(con.oid, true)            AS definition
FROM pg_constraint con
JOIN pg_class rel      ON rel.oid = con.conrelid
JOIN pg_namespace nsp  ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'categorias'
ORDER BY con.contype ASC, con.conname ASC;
