-- ============================================================================
-- FASE 03 — Promover "Nacimientos" a categoría padre y crear subcategorías "Niño" y "Niña"
-- Archivo: docs/sql/003-nacimientos-padre.sql
-- Decisión D1 = B:
--   1. "Nacimientos" (slug = 'nacimientos') pasa a ser categoría PADRE (parent_id = NULL,
--      orden = 2 junto a "Ocasión").
--   2. Se crean las subcategorías "Niño" (slug = 'nacimientos-nino', orden = 1) y
--      "Niña" (slug = 'nacimientos-nina', orden = 2) bajo "Nacimientos", con activo = true.
--   3. Los 39 productos actuales de "Nacimientos" NO se mueven en este script: permanecen
--      en "Nacimientos" padre hasta que la encargada los clasifique en "Niño" o "Niña"
--      desde /admin/productos. Mientras "Niño" y "Niña" tengan 0 productos activos,
--      la web pública los oculta automáticamente y muestra los 39 productos en /categoria/nacimientos.
-- ============================================================================

BEGIN;

-- 1. Promover "Nacimientos" a categoría principal (junto a Ocasión que tiene orden = 1)
UPDATE public.categorias
SET
  parent_id = NULL,
  orden = 2
WHERE slug = 'nacimientos';

-- 2. Crear subcategorías "Niño" y "Niña" bajo "Nacimientos" (idempotente con ON CONFLICT)
INSERT INTO public.categorias (nombre, slug, parent_id, activo, orden)
VALUES
  (
    'Niño',
    'nacimientos-nino',
    (SELECT id FROM public.categorias WHERE slug = 'nacimientos'),
    true,
    1
  ),
  (
    'Niña',
    'nacimientos-nina',
    (SELECT id FROM public.categorias WHERE slug = 'nacimientos'),
    true,
    2
  )
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-EJECUCIÓN (SOLO LECTURA)
-- ============================================================================
SELECT
  c.id,
  c.nombre,
  c.slug,
  c.activo,
  c.orden,
  c.parent_id,
  p.nombre AS parent_nombre,
  COUNT(pr.id) FILTER (WHERE pr.activo = true) AS productos_activos
FROM public.categorias c
LEFT JOIN public.categorias p ON p.id = c.parent_id
LEFT JOIN public.productos pr ON pr.categoria_id = c.id
WHERE c.slug IN ('nacimientos', 'nacimientos-nino', 'nacimientos-nina', 'ocasion')
GROUP BY c.id, c.nombre, c.slug, c.activo, c.orden, c.parent_id, p.nombre
ORDER BY c.parent_id NULLS FIRST, c.orden;

-- ============================================================================
-- ROLLBACK (COMENTADO — ejecutar solo si se desea revertir al estado anterior)
-- ============================================================================
-- BEGIN;
--
-- -- Si algún producto fue movido a Niño/Niña, devolverlo primero a Nacimientos
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'nacimientos')
-- WHERE categoria_id IN (
--   SELECT id FROM public.categorias WHERE slug IN ('nacimientos-nino', 'nacimientos-nina')
-- );
--
-- -- Eliminar las subcategorías Niño y Niña
-- DELETE FROM public.categorias
-- WHERE slug IN ('nacimientos-nino', 'nacimientos-nina');
--
-- -- Devolver Nacimientos como subcategoría de Ocasión (orden = 0)
-- UPDATE public.categorias
-- SET
--   parent_id = (SELECT id FROM public.categorias WHERE slug = 'ocasion'),
--   orden = 0
-- WHERE slug = 'nacimientos';
--
-- COMMIT;
