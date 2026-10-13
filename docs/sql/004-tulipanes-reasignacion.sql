-- ============================================================================
-- FASE 03 — Reasignación sugerida de los 13 productos en "Tulipanes" padre
-- Archivo: docs/sql/004-tulipanes-reasignacion.sql
--
-- IMPORTANTE:
--   Todo este script está COMENTADO a propósito.
--   Jack o la encargada pueden:
--     Opción A: Reasignar cada producto desde /admin/productos usando el nuevo
--               selector agrupado ("Tulipanes › Ramos", "Tulipanes › Arreglos",
--               "Primaverales › Girasoles", etc.).
--     Opción B: Descomentar únicamente las sentencias UPDATE que deseen aplicar
--               y ejecutarlas en el SQL Editor de Supabase.
--
-- IDs de categorías destino de referencia en producción:
--   - Tulipanes (Principal)          : a7511a7c-a64b-427b-bc19-82da00ce63cc (slug: 'tulipanes')
--   - Tulipanes › Ramos              : 1036ab86-e9b0-4f2a-9aeb-ce658d1231ef (slug: 'ramos-tulipanes')
--   - Tulipanes › Arreglos           : 667e9006-5ac9-45e9-9ebf-13701f55f98e (slug: 'arreglos-tulipanes')
--   - Primaverales (Principal)       : 4acfcfea-15a6-44c8-a0cc-500f420648cf (slug: 'primaverales')
--   - Primaverales › Girasoles       : 1415a57d-ebde-4353-8a9f-98d1cb14ce79 (slug: 'girasoles')
--   - Arreglos Florales › Ramos      : c98bd545-af26-4ff0-a5b3-08ffef4fa9cf (slug: 'ramos')
-- ============================================================================

-- BEGIN;

-- 1) "Arreglo Alegría Campestre de Girasoles" (S/ 100) -> Sugerido: Primaverales › Girasoles ('girasoles')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'girasoles')
-- WHERE id = '338d35a8-fe5a-400f-a8e3-f0948f6cbf76';

-- 2) "Bouquet Resplandor Solar & Follaje" (S/ 100) -> Sugerido: Primaverales › Girasoles ('girasoles')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'girasoles')
-- WHERE id = 'c9227cec-1fef-4efa-b907-952439d3443d';

-- 3) "Canasta Girasoles Silvestres & Gerberas" (S/ 100) -> Sugerido: Primaverales › Girasoles ('girasoles')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'girasoles')
-- WHERE id = 'd7d6dfcf-5379-4c2b-81fa-a90134be0b49';

-- 4) "Bouquet Campo Dorado & Follaje" (S/ 100) -> Sugerido: Primaverales ('primaverales')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'primaverales')
-- WHERE id = '8385c1ec-4176-4c32-9636-ec8f38190ba1';

-- 5) "Bouquet Resplandor Solar & Follaje N° 4" (S/ 100) -> Sugerido: Primaverales › Girasoles ('girasoles')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'girasoles')
-- WHERE id = '1a462007-5b9e-4f74-a99f-a44ed76c156e';

-- 6) "Bouquet Luz de Verano & Solidago N° 3" (S/ 100) -> Sugerido: Primaverales ('primaverales')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'primaverales')
-- WHERE id = '6d10b7f9-4b76-4ff5-b320-0a61d9bda15e';

-- 7) "Bouquet Radiante Prado Dorado N° 9" (S/ 100) -> Sugerido: Primaverales ('primaverales')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'primaverales')
-- WHERE id = 'a8f50542-3d27-48e3-afef-1d4db4016597';

-- 8) "Bouquet Silvestre Girasoles Deluxe N° 6" (S/ 100) -> Sugerido: Primaverales › Girasoles ('girasoles')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'girasoles')
-- WHERE id = '2ee59e5c-11c0-4083-b4dc-f4922a7b861f';

-- 9) "Bouquet Serenidad de Lirios Blancos N° 2" (S/ 100) -> Sugerido: Arreglos Florales › Ramos ('ramos')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'ramos')
-- WHERE id = '2e34d317-e64a-4669-b799-1266ffef9ada';

-- 10) "Bouquet Floral Tulipanes Amarillos Radiantes" (S/ 100) -> Sugerido: Tulipanes › Ramos ('ramos-tulipanes')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'ramos-tulipanes')
-- WHERE id = '9e222bd5-1cc7-494e-8ab5-79d8470f495a';

-- 11) "Box Negro Tulipanes Bicolor Fucsia y Naranja" (S/ 100) -> Sugerido: Tulipanes › Arreglos ('arreglos-tulipanes')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'arreglos-tulipanes')
-- WHERE id = 'ce1813d5-eb8f-47a8-9bca-a456616b2084';

-- 12) "Box Blanco Tulipanes Fucsia & Follaje Fresco" (S/ 100) -> Sugerido: Tulipanes › Arreglos ('arreglos-tulipanes')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'arreglos-tulipanes')
-- WHERE id = 'b6d29773-c323-45d5-8fa5-91c5014d2b3a';

-- 13) "Centro Primaveral" (S/ 100) -> Sugerido: Primaverales ('primaverales')
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'primaverales')
-- WHERE id = 'da4237ff-0270-43cd-9774-8cbcde6a95d4';

-- COMMIT;

-- ============================================================================
-- ROLLBACK (COMENTADO — devuelve los 13 productos a "Tulipanes" padre)
-- ============================================================================
-- UPDATE public.productos
-- SET categoria_id = (SELECT id FROM public.categorias WHERE slug = 'tulipanes')
-- WHERE id IN (
--   '338d35a8-fe5a-400f-a8e3-f0948f6cbf76',
--   'c9227cec-1fef-4efa-b907-952439d3443d',
--   'd7d6dfcf-5379-4c2b-81fa-a90134be0b49',
--   '8385c1ec-4176-4c32-9636-ec8f38190ba1',
--   '1a462007-5b9e-4f74-a99f-a44ed76c156e',
--   '6d10b7f9-4b76-4ff5-b320-0a61d9bda15e',
--   'a8f50542-3d27-48e3-afef-1d4db4016597',
--   '2ee59e5c-11c0-4083-b4dc-f4922a7b861f',
--   '2e34d317-e64a-4669-b799-1266ffef9ada',
--   '9e222bd5-1cc7-494e-8ab5-79d8470f495a',
--   'ce1813d5-eb8f-47a8-9bca-a456616b2084',
--   'b6d29773-c323-45d5-8fa5-91c5014d2b3a',
--   'da4237ff-0270-43cd-9774-8cbcde6a95d4'
-- );
