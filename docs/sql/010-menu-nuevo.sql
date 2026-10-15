-- ==============================================================================
-- MIGRACIÓN 010: Reorganización del Menú de Categorías (Pedido de Sofía)
-- Florería Miraflores — Fase 06-F
--
-- PROPÓSITO:
-- 1. Ocasión:
--    - Mover 'Inauguración' (slug 'inauguracion', actualmente bajo Arreglos Florales e inactiva)
--      a 'Ocasión' y activarla.
--    - Insertar 'Centros de mesa' (slug 'centros-de-mesa') bajo 'Ocasión'.
--    - Insertar 'Floreros' (slug 'floreros') bajo 'Ocasión'.
-- 2. Nacimientos:
--    - Confirmar que existen las hijas 'Niño' (slug 'nacimientos-nino') y 'Niña' (slug 'nacimientos-nina').
-- 3. Arreglos Premium:
--    - Quitarla como categoría padre de primer nivel convirtiéndola en subcategoría hija
--      de 'Arreglos Florales' (parent_id = 'bf0b8e45-756a-4ddb-81f6-0079b80b052a').
--      (De esta forma NO se pierden sus 50 productos activos ni su URL canónica).
-- 4. Condolencias:
--    - Renombrar la categoría padre 'Defunción' a 'Condolencias' manteniendo su id e hijas
--      existentes ('Coronas Fúnebres', 'Cruces', 'Lágrima con Pedestal', 'Lágrimas', 'Mantos').
-- 5. Complementos:
--    - Crear categoría padre 'Complementos' (slug 'complementos').
--    - Crear hijas: 'Chocolates', 'Peluches', 'Globos', 'Toppers', 'Licores'.
-- 6. Orden del Menú:
--    1. Ocasión, 2. Nacimientos, 3. Arreglos florales, 4. Condolencias, 5. Tulipanes,
--    6. Primaverales, 7. Novedades, 8. Ofertas, 9. Complementos.
--
-- NOTA:
--   Sin sentencias DELETE. 100% idempotente con ON CONFLICT y WHERE condicionales.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Ocasión: vincular / crear hijas
-- ------------------------------------------------------------------------------
-- Mover 'Inauguración' existente a Ocasión y activarla
UPDATE public.categorias
SET parent_id = '7d02d578-f32c-4b3d-82c6-6194ee0e2a82',
    activo = true,
    orden = 5
WHERE slug = 'inauguracion';

-- Crear 'Centros de mesa' y 'Floreros' bajo Ocasión
INSERT INTO public.categorias (id, nombre, slug, parent_id, orden, activo)
VALUES 
  (gen_random_uuid(), 'Centros de mesa', 'centros-de-mesa', '7d02d578-f32c-4b3d-82c6-6194ee0e2a82', 6, true),
  (gen_random_uuid(), 'Floreros', 'floreros', '7d02d578-f32c-4b3d-82c6-6194ee0e2a82', 7, true)
ON CONFLICT (slug) DO UPDATE
SET parent_id = EXCLUDED.parent_id,
    nombre = EXCLUDED.nombre,
    activo = EXCLUDED.activo;

-- ------------------------------------------------------------------------------
-- 2. Arreglos Premium: sacar del menú padre convirtiéndola en subcategoría hija
-- ------------------------------------------------------------------------------
UPDATE public.categorias
SET parent_id = 'bf0b8e45-756a-4ddb-81f6-0079b80b052a', -- Arreglos Florales
    orden = 10
WHERE slug = 'arreglos-premium';

-- ------------------------------------------------------------------------------
-- 3. Condolencias: renombrar 'Defunción' a 'Condolencias'
-- ------------------------------------------------------------------------------
UPDATE public.categorias
SET nombre = 'Condolencias',
    orden = 4
WHERE id = '99ef0939-f5c5-4d0b-9aeb-41040869b7d4';

-- ------------------------------------------------------------------------------
-- 4. Complementos: crear padre e hijas
-- ------------------------------------------------------------------------------
INSERT INTO public.categorias (id, nombre, slug, parent_id, orden, activo)
VALUES (gen_random_uuid(), 'Complementos', 'complementos', NULL, 9, true)
ON CONFLICT (slug) DO UPDATE
SET orden = 9,
    activo = true;

-- Hijas de Complementos
INSERT INTO public.categorias (id, nombre, slug, parent_id, orden, activo)
SELECT gen_random_uuid(), c.nombre, c.slug, p.id, c.orden, true
FROM (VALUES
  ('Chocolates', 'chocolates', 1),
  ('Peluches', 'peluches', 2),
  ('Globos', 'globos', 3),
  ('Toppers', 'toppers', 4),
  ('Licores', 'licores', 5)
) AS c(nombre, slug, orden)
CROSS JOIN (SELECT id FROM public.categorias WHERE slug = 'complementos' LIMIT 1) p
ON CONFLICT (slug) DO UPDATE
SET parent_id = EXCLUDED.parent_id,
    nombre = EXCLUDED.nombre,
    orden = EXCLUDED.orden,
    activo = EXCLUDED.activo;

-- ------------------------------------------------------------------------------
-- 5. Orden oficial del Menú
-- ------------------------------------------------------------------------------
UPDATE public.categorias SET orden = 1 WHERE slug = 'ocasion';
UPDATE public.categorias SET orden = 2 WHERE slug = 'nacimientos';
UPDATE public.categorias SET orden = 3 WHERE slug = 'arreglos-florales';
UPDATE public.categorias SET orden = 4 WHERE id = '99ef0939-f5c5-4d0b-9aeb-41040869b7d4'; -- Condolencias
UPDATE public.categorias SET orden = 5 WHERE slug = 'tulipanes';
UPDATE public.categorias SET orden = 6 WHERE slug = 'primaverales';
UPDATE public.categorias SET orden = 7 WHERE slug = 'novedades';
UPDATE public.categorias SET orden = 8 WHERE slug = 'ofertas';
UPDATE public.categorias SET orden = 9 WHERE slug = 'complementos';

-- Categorías restantes fuera del menú principal
UPDATE public.categorias SET orden = 10 WHERE slug = 'corporativo';
UPDATE public.categorias SET orden = 11 WHERE slug = 'mas-vendido';

COMMIT;

-- ==============================================================================
-- CONSULTAS DE VERIFICACIÓN (DESPUÉS):
--
-- 1. Árbol de categorías padres ordenadas:
-- SELECT orden, nombre, slug, activo
-- FROM public.categorias
-- WHERE parent_id IS NULL
-- ORDER BY orden ASC;
--
-- 2. Hijas de Ocasión:
-- SELECT c.orden, c.nombre, c.slug, c.activo
-- FROM public.categorias c
-- WHERE c.parent_id = '7d02d578-f32c-4b3d-82c6-6194ee0e2a82'
-- ORDER BY c.orden ASC;
--
-- 3. Hijas de Condolencias:
-- SELECT c.orden, c.nombre, c.slug, c.activo
-- FROM public.categorias c
-- WHERE c.parent_id = '99ef0939-f5c5-4d0b-9aeb-41040869b7d4'
-- ORDER BY c.orden ASC;
--
-- 4. Hijas de Complementos:
-- SELECT c.orden, c.nombre, c.slug, c.activo
-- FROM public.categorias c
-- JOIN public.categorias p ON c.parent_id = p.id
-- WHERE p.slug = 'complementos'
-- ORDER BY c.orden ASC;
-- ==============================================================================

-- ==============================================================================
-- REVERSA (ROLLBACK):
--
-- BEGIN;
-- -- 1. Restaurar Inauguración a Arreglos Florales e inactiva
-- UPDATE public.categorias SET parent_id = 'bf0b8e45-756a-4ddb-81f6-0079b80b052a', activo = false, orden = 0 WHERE slug = 'inauguracion';
--
-- -- 2. Desactivar categorías nuevas (sin DELETE)
-- UPDATE public.categorias SET activo = false WHERE slug IN (
--   'centros-de-mesa', 'floreros', 'complementos', 'chocolates', 'peluches', 'globos', 'toppers', 'licores'
-- );
--
-- -- 3. Restaurar Arreglos Premium como padre con orden 4
-- UPDATE public.categorias SET parent_id = NULL, orden = 4 WHERE slug = 'arreglos-premium';
--
-- -- 4. Restaurar Defunción con su nombre y orden 7
-- UPDATE public.categorias SET nombre = 'Defunción', orden = 7 WHERE id = '99ef0939-f5c5-4d0b-9aeb-41040869b7d4';
--
-- -- 5. Restaurar órdenes originales de las categorías padres
-- UPDATE public.categorias SET orden = 1 WHERE slug = 'ocasion';
-- UPDATE public.categorias SET orden = 2 WHERE slug = 'nacimientos';
-- UPDATE public.categorias SET orden = 3 WHERE slug = 'arreglos-florales';
-- UPDATE public.categorias SET orden = 4 WHERE slug = 'arreglos-premium';
-- UPDATE public.categorias SET orden = 5 WHERE slug = 'tulipanes';
-- UPDATE public.categorias SET orden = 6 WHERE slug = 'primaverales';
-- UPDATE public.categorias SET orden = 7 WHERE slug = 'defuncion';
-- UPDATE public.categorias SET orden = 8 WHERE slug = 'novedades';
-- UPDATE public.categorias SET orden = 9 WHERE slug = 'ofertas';
-- UPDATE public.categorias SET orden = 10 WHERE slug = 'corporativo';
-- UPDATE public.categorias SET orden = 11 WHERE slug = 'mas-vendido';
-- COMMIT;
-- ==============================================================================
