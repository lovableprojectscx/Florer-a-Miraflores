-- ==============================================================================
-- MIGRACIÓN 015: SOFÍA — NOVEDADES EN OCASIÓN Y ORQUÍDEAS COMO CATEGORÍA PADRE
-- Fecha: 2026-11-04
-- Solicitado por: Sofía (audios/videos WhatsApp 10:47 PM, 10:48 PM, 10:51 PM)
--
-- REQUERIMIENTOS:
-- 1. Novedades pasa a ser subcategoría de Ocasión al final (orden 8).
-- 2. Orquídeas pasa a ser categoría Padre principal en el menú (orden 7).
-- 3. "Orquídeas Fiesta Prom" pasa a ser subcategoría hija de Orquídeas (orden 1).
--
-- REGLA DE ORO DE SEGURIDAD:
-- CERO modificaciones o eliminaciones en la tabla `productos`.
-- ==============================================================================

BEGIN;

-- 1. Mover Novedades como subcategoría bajo Ocasión al final
UPDATE categorias
SET
  parent_id = '7d02d578-f32c-4b3d-82c6-6194ee0e2a82', -- Ocasión
  orden = 8,
  activo = true
WHERE id = 'f8202a90-06f6-4284-9053-16cad544164c'; -- Novedades

-- 2. Promover Orquídeas como categoría Padre en la barra principal
UPDATE categorias
SET
  parent_id = NULL,
  nombre = 'Orquídeas',
  slug = 'orquideas',
  orden = 7,
  activo = true
WHERE id = '50c4251e-d651-40e7-a8b4-b77c0119156c'; -- Orquídeas

-- 3. Configurar Orquídeas Fiesta Prom como subcategoría hija de Orquídeas
UPDATE categorias
SET
  parent_id = '50c4251e-d651-40e7-a8b4-b77c0119156c', -- Orquídeas Padre
  nombre = 'Orquídeas Fiesta Prom',
  slug = 'orquideas-fiesta-prom',
  orden = 1,
  activo = true
WHERE id = '1e64bfa4-a0c6-4a5a-915b-80be9279be57'; -- Orquídeas Fiesta Prom

COMMIT;
