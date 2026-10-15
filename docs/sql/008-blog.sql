-- ==============================================================================
-- MIGRACIÓN 008: Blog Administrable para SEO
-- Florería Miraflores — Fase 09 (Blog)
--
-- PROPÓSITO:
-- 1. Crear la tabla `public.blog_posts` para almacenar artículos de blog
--    redactados por Sofía o la encargada desde el panel administrativo.
-- 2. Activar Row Level Security (RLS):
--    - Lectura pública: artículos publicados con fecha vigente (`publicado = true AND fecha_publicacion <= now()`)
--      o usuarios administradores (`is_admin()`).
--    - Escritura (INSERT, UPDATE, DELETE): exclusivo administradores (`is_admin()`).
-- 3. Crear trigger para actualizar automáticamente `updated_at`.
-- 4. Crear bucket de Supabase Storage `blog` (público) con policies
--    de escritura restringidas a `is_admin()`.
--
-- NOTA DE IDEMPOTENCIA:
--   Usa CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS,
--   INSERT INTO storage.buckets ... ON CONFLICT DO NOTHING,
--   y bloques condicionales DO $$ para policies y triggers.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Función trigger para actualizar updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_blog_posts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ------------------------------------------------------------------------------
-- 2. Tabla `public.blog_posts`
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text UNIQUE NOT NULL,
  resumen text,
  contenido text NOT NULL,
  imagen_portada_url text,
  autor text DEFAULT 'Florería Miraflores',
  categoria_relacionada_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  publicado boolean NOT NULL DEFAULT false,
  fecha_publicacion timestamptz,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices de consulta frecuente
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publicado_fecha ON public.blog_posts (publicado, fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_categoria ON public.blog_posts (categoria_relacionada_id);

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

-- Habilitar RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. Políticas RLS para `public.blog_posts`
-- ------------------------------------------------------------------------------
-- Lectura pública: anónimos solo leen publicados vigentes; admins leen borradores y programados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_posts' AND policyname = 'Public Read blog_posts'
  ) THEN
    CREATE POLICY "Public Read blog_posts"
    ON public.blog_posts
    FOR SELECT
    TO public
    USING ((publicado = true AND fecha_publicacion <= now()) OR is_admin());
  END IF;
END $$;

-- Escritura: solo administradores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_posts' AND policyname = 'Admin Write blog_posts'
  ) THEN
    CREATE POLICY "Admin Write blog_posts"
    ON public.blog_posts
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Bucket de Supabase Storage `blog` y sus policies
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog', 'blog', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  -- Lectura pública del bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'lectura publica de blog'
  ) THEN
    CREATE POLICY "lectura publica de blog"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'blog');
  END IF;

  -- Admin sube fotos del blog
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede subir blog'
  ) THEN
    CREATE POLICY "admin puede subir blog"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'blog' AND is_admin());
  END IF;

  -- Admin actualiza fotos del blog
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede actualizar blog'
  ) THEN
    CREATE POLICY "admin puede actualizar blog"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'blog' AND is_admin());
  END IF;

  -- Admin elimina fotos del blog
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede eliminar blog'
  ) THEN
    CREATE POLICY "admin puede eliminar blog"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'blog' AND is_admin());
  END IF;
END $$;

COMMIT;

-- ------------------------------------------------------------------------------
-- CONSULTAS DE VERIFICACIÓN (DESPUÉS DE APLICAR)
-- ------------------------------------------------------------------------------
-- 1. Verificar estructura de la tabla:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'blog_posts'
-- ORDER BY ordinal_position;
--
-- 2. Verificar RLS:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts';
--
-- 3. Verificar policies:
-- SELECT policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'blog_posts';
--
-- 4. Verificar bucket:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'blog';

/*
-- =============================================================================
-- BLOQUE DE REVERSA (ROLLBACK) — Ejecutar solo para deshacer la migración 008
-- =============================================================================
DROP TRIGGER IF EXISTS trigger_blog_posts_updated_at ON public.blog_posts;
DROP FUNCTION IF EXISTS public.set_blog_posts_updated_at();
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP POLICY IF EXISTS "lectura publica de blog" ON storage.objects;
DROP POLICY IF EXISTS "admin puede subir blog" ON storage.objects;
DROP POLICY IF EXISTS "admin puede actualizar blog" ON storage.objects;
DROP POLICY IF EXISTS "admin puede eliminar blog" ON storage.objects;
DELETE FROM storage.buckets WHERE id = 'blog';
-- =============================================================================
*/
