-- ==============================================================================
-- Migración: Tabla de Suscriptores para Popup y Listón Lateral
-- Florería Miraflores
-- ==============================================================================

-- 1. Crear tabla de suscriptores
CREATE TABLE IF NOT EXISTS public.suscriptores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefono TEXT NOT NULL,
  origen TEXT DEFAULT 'popup_home',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.suscriptores ENABLE ROW LEVEL SECURITY;

-- 3. Política para permitir a los visitantes anónimos registrar su celular
DROP POLICY IF EXISTS "insert_public_suscriptores" ON public.suscriptores;
CREATE POLICY "insert_public_suscriptores" ON public.suscriptores
  FOR INSERT WITH CHECK (true);

-- 4. Política para que solo usuarios autenticados (administradores) puedan consultar los suscriptores
DROP POLICY IF EXISTS "admin_all_suscriptores" ON public.suscriptores;
CREATE POLICY "admin_all_suscriptores" ON public.suscriptores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE public.suscriptores IS 'Registro de celulares de clientes suscritos a ofertas y novedades vía popup o listón lateral.';
