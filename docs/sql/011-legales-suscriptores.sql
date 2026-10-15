-- ==============================================================================
-- SQL 011 — Legales, Suscriptores con Consentimiento y Términos en Pedidos
-- Florería Miraflores — Fase 10
-- ==============================================================================
-- NOTA: NO EJECUTAR hasta contar con la autorización:
-- "SQL 011 aprobado por el revisor"
-- ==============================================================================

-- 1. Tabla de suscriptores con consentimiento informado
CREATE TABLE IF NOT EXISTS public.suscriptores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 60),
  telefono text NOT NULL UNIQUE CHECK (telefono ~ '^\+519[0-9]{8}$'),
  consentimiento boolean NOT NULL CHECK (consentimiento = true),
  consentimiento_texto text NOT NULL,
  origen text NOT NULL DEFAULT 'popup_home',
  activo boolean NOT NULL DEFAULT true,
  baja_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS en suscriptores
ALTER TABLE public.suscriptores ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Seguridad (RLS) idempotentes
-- Público (anon / authenticated): solo puede insertar si otorga consentimiento válido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'suscriptores' AND policyname = 'Public insert suscriptores'
  ) THEN
    CREATE POLICY "Public insert suscriptores" ON public.suscriptores
      FOR INSERT TO anon, authenticated
      WITH CHECK (consentimiento = true AND activo = true AND baja_at IS NULL);
  END IF;
END $$;

-- Admin (authenticated + public.is_admin()): control total
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'suscriptores' AND policyname = 'Admin all suscriptores'
  ) THEN
    CREATE POLICY "Admin all suscriptores" ON public.suscriptores
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 3. Evidencia de aceptación de términos en pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS acepto_terminos boolean NOT NULL DEFAULT false;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS acepto_terminos_at timestamptz;

-- 4. Validación de términos y asignación de timestamp en el servidor (solo INSERT)
CREATE OR REPLACE FUNCTION public.pedidos_terminos_check()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.acepto_terminos IS DISTINCT FROM true AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Debe aceptar los terminos y condiciones';
  END IF;
  IF NEW.acepto_terminos THEN
    NEW.acepto_terminos_at := now();   -- hora del servidor, no del navegador
  END IF;
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_pedidos_terminos' AND tgrelid = 'public.pedidos'::regclass
  ) THEN
    CREATE TRIGGER trg_pedidos_terminos
      BEFORE INSERT ON public.pedidos
      FOR EACH ROW EXECUTE FUNCTION public.pedidos_terminos_check();
  END IF;
END $$;

-- ==============================================================================
-- CONSULTAS DE VERIFICACIÓN (EJECUTAR DESPUÉS DE LA MIGRACIÓN)
-- ==============================================================================
/*
-- 1. Columnas de public.suscriptores:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'suscriptores'
ORDER BY ordinal_position;

-- 2. Estado de RLS en public.suscriptores:
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'suscriptores';

-- 3. Políticas activas en public.suscriptores:
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'suscriptores';

-- 4. Columnas de evidencia en public.pedidos:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pedidos'
  AND column_name IN ('acepto_terminos', 'acepto_terminos_at');

-- 5. Trigger en public.pedidos:
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.pedidos'::regclass AND NOT tgisinternal;
*/

-- ==============================================================================
-- BLOQUE DE REVERSA (ROLLBACK) - SOLO SI SE REQUIERE DESHACER LA FASE 10
-- ==============================================================================
/*
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suscriptores' AND policyname = 'Public insert suscriptores') THEN
    DROP POLICY "Public insert suscriptores" ON public.suscriptores;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suscriptores' AND policyname = 'Admin all suscriptores') THEN
    DROP POLICY "Admin all suscriptores" ON public.suscriptores;
  END IF;
END $$;

DROP TABLE IF EXISTS public.suscriptores;

ALTER TABLE public.pedidos DROP COLUMN IF EXISTS acepto_terminos_at;
ALTER TABLE public.pedidos DROP COLUMN IF EXISTS acepto_terminos;
*/
