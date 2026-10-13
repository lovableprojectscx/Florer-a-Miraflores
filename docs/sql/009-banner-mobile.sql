-- ==============================================================================
-- MIGRACIÓN 009: Columna imagen_mobile_url en tabla banners
-- Florería Miraflores — Fase 06-D (Optimización Responsive Celular)
--
-- DESCRIPCIÓN:
-- Agrega la columna opcional `imagen_mobile_url` a la tabla `banners` para permitir
-- que el administrador suba una versión adaptada para móviles (1080 x 1350 px, 4:5).
-- Si es nula, el frontend utiliza la imagen de escritorio (8:3) como fallback.
--
-- IDEMPOTENCIA:
-- Utiliza `ADD COLUMN IF NOT EXISTS`.
-- ==============================================================================

ALTER TABLE public.banners
ADD COLUMN IF NOT EXISTS imagen_mobile_url text;

COMMENT ON COLUMN public.banners.imagen_mobile_url IS 'URL de la imagen optimizada para dispositivos móviles (1080x1350, 4:5). Opcional.';

-- ==============================================================================
-- VERIFICACIÓN (SELECT DESPUÉS):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'banners' AND column_name = 'imagen_mobile_url';
-- ==============================================================================

-- ==============================================================================
-- REVERSA (ROLLBACK):
-- ALTER TABLE public.banners DROP COLUMN IF EXISTS imagen_mobile_url;
-- ==============================================================================
