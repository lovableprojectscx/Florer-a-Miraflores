-- ==============================================================================
-- MIGRACIÓN 012: Mural de Recuerdos de Entrega (Pivote Estratégico Fase 09)
-- Florería Miraflores
--
-- PROPÓSITO:
-- 1. Transición de la tabla editorial para soportar Recuerdos reales de entrega.
-- 2. Vincular recuerdos con distritos (distritos.id) y productos (productos.id).
-- 3. Activar Row Level Security (RLS) estricto:
--    - Lectura pública: publicados con fecha vigente o is_admin().
--    - Escritura: exclusivo administradores (is_admin()).
-- 4. Soporte para galería de fotos y ordenamiento manual.
-- ==============================================================================

BEGIN;

-- 1. Renombrar blog_posts a recuerdos si existe y recuerdos aún no
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_posts')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recuerdos') THEN
    ALTER TABLE public.blog_posts RENAME TO recuerdos;
  END IF;
END $$;

-- 2. Si no existía blog_posts, crear recuerdos desde cero
CREATE TABLE IF NOT EXISTS public.recuerdos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text UNIQUE NOT NULL,
  resumen text,
  contenido text NOT NULL,
  imagen_portada_url text,
  autor text DEFAULT 'Florería Miraflores',
  categoria_relacionada_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  publicado boolean NOT NULL DEFAULT false,
  fecha_publicacion timestamptz DEFAULT now(),
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Agregar columnas específicas de Recuerdos de Entrega
ALTER TABLE public.recuerdos
  ADD COLUMN IF NOT EXISTS distrito_id uuid REFERENCES public.distritos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fotos_galeria text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS destacado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS orden integer NOT NULL DEFAULT 0;

-- 4. Índices para rendimiento en búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_recuerdos_slug ON public.recuerdos (slug);
CREATE INDEX IF NOT EXISTS idx_recuerdos_publicado_fecha ON public.recuerdos (publicado, fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_recuerdos_categoria ON public.recuerdos (categoria_relacionada_id);
CREATE INDEX IF NOT EXISTS idx_recuerdos_distrito ON public.recuerdos (distrito_id);
CREATE INDEX IF NOT EXISTS idx_recuerdos_producto ON public.recuerdos (producto_id);

-- 5. Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_recuerdos_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_recuerdos_updated_at'
  ) THEN
    CREATE TRIGGER trigger_recuerdos_updated_at
      BEFORE UPDATE ON public.recuerdos
      FOR EACH ROW
      EXECUTE FUNCTION public.set_recuerdos_updated_at();
  END IF;
END $$;

-- 6. Habilitar RLS y políticas
ALTER TABLE public.recuerdos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'recuerdos' AND policyname = 'Public Read recuerdos'
  ) THEN
    CREATE POLICY "Public Read recuerdos"
    ON public.recuerdos
    FOR SELECT
    TO public
    USING ((publicado = true AND fecha_publicacion <= now()) OR is_admin());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'recuerdos' AND policyname = 'Admin Write recuerdos'
  ) THEN
    CREATE POLICY "Admin Write recuerdos"
    ON public.recuerdos
    FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());
  END IF;
END $$;

-- 7. Vista de compatibilidad para evitar roturas de cualquier lectura legacy
CREATE OR REPLACE VIEW public.blog_posts 
WITH (security_invoker = true) AS
  SELECT id, titulo, slug, resumen, contenido, imagen_portada_url, autor,
         categoria_relacionada_id, publicado, fecha_publicacion, meta_title,
         meta_description, created_at, updated_at
  FROM public.recuerdos;

COMMIT;
