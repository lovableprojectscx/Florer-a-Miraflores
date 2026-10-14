-- ==============================================================================
-- MIGRACIÓN 007: Testimonios y Configuración de Reseñas de Google
-- Florería Miraflores — Fase 07 (Reseñas y Testimonios)
--
-- PROPÓSITO:
-- 1. Crear la tabla `public.testimonios` para almacenar reseñas reales
--    (copiadas a mano desde Google, WhatsApp, Facebook o Directo).
-- 2. Activar Row Level Security (RLS):
--    - Lectura pública: solo registros activos (`activo = true`) o si es admin.
--    - Escritura (INSERT, UPDATE, DELETE): solo administradores (`is_admin()`).
-- 3. Agregar columnas en `public.config` para la integración de Google Reviews
--    y visibilidad de la franja en el Home:
--    - `google_reviews_url` (text)
--    - `google_rating` (numeric(2,1))
--    - `google_reviews_count` (int)
--    - `mostrar_resenas_home` (bool default false)
-- 4. Crear bucket de Supabase Storage `testimonios` (público) con policies
--    de escritura restringidas a `is_admin()`.
--
-- NOTA DE IDEMPOTENCIA:
--   Usa CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
--   INSERT INTO storage.buckets ... ON CONFLICT DO NOTHING,
--   y verificaciones condicionales para policies.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Tabla `public.testimonios`
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  texto text NOT NULL,
  estrellas int NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  fecha date,
  fuente text NOT NULL DEFAULT 'google' CHECK (fuente IN ('google', 'whatsapp', 'facebook', 'directo')),
  enlace_original text,
  imagen_url text,
  destacado boolean NOT NULL DEFAULT false,
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices de consulta frecuente
CREATE INDEX IF NOT EXISTS idx_testimonios_activo_orden ON public.testimonios (activo, destacado DESC, orden ASC, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.testimonios ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Políticas RLS para `public.testimonios`
-- ------------------------------------------------------------------------------
-- Lectura pública: usuarios anónimos ven solo activos; admins ven todos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'testimonios' AND policyname = 'Public Read testimonios'
  ) THEN
    CREATE POLICY "Public Read testimonios"
    ON public.testimonios
    FOR SELECT
    TO public
    USING (activo = true OR is_admin());
  END IF;
END $$;

-- Escritura: solo usuarios en public.admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'testimonios' AND policyname = 'Admin Write testimonios'
  ) THEN
    CREATE POLICY "Admin Write testimonios"
    ON public.testimonios
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Columnas de Reseñas en `public.config`
-- ------------------------------------------------------------------------------
ALTER TABLE public.config
  ADD COLUMN IF NOT EXISTS google_reviews_url text,
  ADD COLUMN IF NOT EXISTS google_rating numeric(2,1),
  ADD COLUMN IF NOT EXISTS google_reviews_count integer,
  ADD COLUMN IF NOT EXISTS mostrar_resenas_home boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.config.google_reviews_url IS 'URL del perfil de Google Maps/Business para el botón "Ver todas en Google"';
COMMENT ON COLUMN public.config.google_rating IS 'Puntuación promedio real de Google (ej. 4.9)';
COMMENT ON COLUMN public.config.google_reviews_count IS 'Cantidad total de reseñas en Google (ej. 120)';
COMMENT ON COLUMN public.config.mostrar_resenas_home IS 'Controla si se muestra el carrusel de reseñas en el Home (requiere >= 3 activas)';

-- ------------------------------------------------------------------------------
-- 4. Bucket de Supabase Storage `testimonios` y sus policies
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonios', 'testimonios', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  -- Lectura pública del bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'lectura publica de testimonios'
  ) THEN
    CREATE POLICY "lectura publica de testimonios"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'testimonios');
  END IF;

  -- Admin sube fotos de testimonios
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede subir testimonios'
  ) THEN
    CREATE POLICY "admin puede subir testimonios"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'testimonios' AND is_admin());
  END IF;

  -- Admin actualiza fotos de testimonios
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede actualizar testimonios'
  ) THEN
    CREATE POLICY "admin puede actualizar testimonios"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'testimonios' AND is_admin())
    WITH CHECK (bucket_id = 'testimonios' AND is_admin());
  END IF;

  -- Admin elimina fotos de testimonios
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede eliminar testimonios'
  ) THEN
    CREATE POLICY "admin puede eliminar testimonios"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'testimonios' AND is_admin());
  END IF;
END $$;

COMMIT;

-- ==============================================================================
-- VERIFICACIÓN (SELECT DESPUÉS):
--
-- 1. Tabla testimonios:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'testimonios'
-- ORDER BY ordinal_position;
--
-- 2. Columnas en config:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'config' AND column_name IN ('google_reviews_url', 'google_rating', 'google_reviews_count', 'mostrar_resenas_home');
--
-- 3. Policies testimonios:
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'testimonios';
--
-- 4. Bucket y policies storage:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'testimonios';
-- SELECT policyname, cmd FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%testimonios%';
-- ==============================================================================

-- ==============================================================================
-- REVERSA (ROLLBACK):
--
-- ALTER TABLE public.config DROP COLUMN IF EXISTS google_reviews_url;
-- ALTER TABLE public.config DROP COLUMN IF EXISTS google_rating;
-- ALTER TABLE public.config DROP COLUMN IF EXISTS google_reviews_count;
-- ALTER TABLE public.config DROP COLUMN IF EXISTS mostrar_resenas_home;
--
-- DROP POLICY IF EXISTS "Public Read testimonios" ON public.testimonios;
-- DROP POLICY IF EXISTS "Admin Write testimonios" ON public.testimonios;
-- DROP TABLE IF EXISTS public.testimonios;
--
-- DROP POLICY IF EXISTS "lectura publica de testimonios" ON storage.objects;
-- DROP POLICY IF EXISTS "admin puede subir testimonios" ON storage.objects;
-- DROP POLICY IF EXISTS "admin puede actualizar testimonios" ON storage.objects;
-- DROP POLICY IF EXISTS "admin puede eliminar testimonios" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'testimonios';
-- ==============================================================================
