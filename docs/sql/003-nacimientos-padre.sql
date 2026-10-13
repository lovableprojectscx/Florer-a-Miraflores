-- ============================================================================
-- FASE 03 — Promover "Nacimientos" a categoría padre y crear subcategorías "Niño" y "Niña"
-- Archivo: docs/sql/003-nacimientos-padre.sql
-- Decisión D1 = B:
--   1. "Nacimientos" (slug = 'nacimientos') pasa a ser categoría PADRE (parent_id = NULL).
--   2. Se reasigna explícitamente el `orden` de las 11 categorías padre para que no haya
--      empates (ocasion=1, nacimientos=2, arreglos-florales=3, arreglos-premium=4,
--      tulipanes=5, primaverales=6, defuncion=7, novedades=8, ofertas=9,
--      corporativo=10, mas-vendido=11).
--   3. Se crean las subcategorías "Niño" (slug = 'nacimientos-nino', orden = 1) y
--      "Niña" (slug = 'nacimientos-nina', orden = 2) bajo "Nacimientos", con activo = true.
--   4. Los 39 productos actuales de "Nacimientos" NO se mueven en este script: permanecen
--      en "Nacimientos" padre hasta que la encargada los clasifique en "Niño" o "Niña"
--      desde /admin/productos. Mientras "Niño" y "Niña" tengan 0 productos activos,
--      la web pública los oculta automáticamente y muestra los 39 productos en /categoria/nacimientos.
-- ============================================================================

BEGIN;

-- 1. Promover "Nacimientos" a categoría principal
UPDATE public.categorias
SET parent_id = NULL
WHERE slug = 'nacimientos';

-- 2. Asignar orden explícito y sin empates a todas las categorías padre (idempotente)
UPDATE public.categorias
SET orden = CASE slug
  WHEN 'ocasion'           THEN 1
  WHEN 'nacimientos'       THEN 2
  WHEN 'arreglos-florales' THEN 3
  WHEN 'arreglos-premium'  THEN 4
  WHEN 'tulipanes'         THEN 5
  WHEN 'primaverales'      THEN 6
  WHEN 'defuncion'         THEN 7
  WHEN 'novedades'         THEN 8
  WHEN 'ofertas'           THEN 9
  WHEN 'corporativo'       THEN 10
  WHEN 'mas-vendido'       THEN 11
END
WHERE slug IN (
  'ocasion',
  'nacimientos',
  'arreglos-florales',
  'arreglos-premium',
  'tulipanes',
  'primaverales',
  'defuncion',
  'novedades',
  'ofertas',
  'corporativo',
  'mas-vendido'
)
AND parent_id IS NULL;

-- 3. Crear subcategorías "Niño" y "Niña" bajo "Nacimientos" (idempotente con ON CONFLICT)
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
-- A) Nacimientos, sus hijas y Ocasión:
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

-- B) Todas las categorías padre con su orden:
SELECT
  c.id,
  c.nombre,
  c.slug,
  c.activo,
  c.orden
FROM public.categorias c
WHERE c.parent_id IS NULL
ORDER BY c.orden ASC, c.nombre ASC;

-- ============================================================================
-- ROLLBACK (COMENTADO — ejecutar solo si se desea revertir al estado anterior)
-- ============================================================================
-- BEGIN;
--
-- -- 1. Si algún producto fue movido a Niño/Niña, devolverlo primero a Nacimientos
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'nacimientos')
-- WHERE categoria_id IN (
--   SELECT id FROM public.categorias WHERE slug IN ('nacimientos-nino', 'nacimientos-nina')
-- );
--
-- -- 2. Eliminar las subcategorías Niño y Niña
-- DELETE FROM public.categorias
-- WHERE slug IN ('nacimientos-nino', 'nacimientos-nina');
--
-- -- 3. Devolver Nacimientos como subcategoría de Ocasión (orden = 0)
-- UPDATE public.categorias
-- SET
--   parent_id = (SELECT id FROM public.categorias WHERE slug = 'ocasion'),
--   orden = 0
-- WHERE slug = 'nacimientos';
--
-- -- 4. Restaurar el orden original de las categorías padre (1..10)
-- UPDATE public.categorias
-- SET orden = CASE slug
--   WHEN 'ocasion'           THEN 1
--   WHEN 'arreglos-florales' THEN 2
--   WHEN 'arreglos-premium'  THEN 3
--   WHEN 'tulipanes'         THEN 4
--   WHEN 'primaverales'      THEN 5
--   WHEN 'defuncion'         THEN 6
--   WHEN 'novedades'         THEN 7
--   WHEN 'ofertas'           THEN 8
--   WHEN 'corporativo'       THEN 9
--   WHEN 'mas-vendido'       THEN 10
-- END
-- WHERE slug IN (
--   'ocasion',
--   'arreglos-florales',
--   'arreglos-premium',
--   'tulipanes',
--   'primaverales',
--   'defuncion',
--   'novedades',
--   'ofertas',
--   'corporativo',
--   'mas-vendido'
-- )
-- AND parent_id IS NULL;
--
-- COMMIT;
