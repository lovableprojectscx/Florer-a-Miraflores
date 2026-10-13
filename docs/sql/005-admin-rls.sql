-- ============================================================================
-- FASE 03-B — Endurecer seguridad RLS con tabla public.admins y función public.is_admin()
-- Archivo: docs/sql/005-admin-rls.sql
--
-- PROBLEMA QUE RESUELVE:
--   Todas las políticas de escritura en tablas públicas, lectura/escritura en
--   `pedidos` y `reclamaciones`, e INSERT/DELETE en `storage.objects` usaban
--   `auth.uid() IS NOT NULL` (o rol `authenticated` con `true`), permitiendo que
--   CUALQUIER usuario autenticado modifique el catálogo o lea pedidos/reclamaciones.
--
-- SOLUCIÓN:
--   1. Tabla `public.admins` (RLS activo, sin policies públicas).
--   2. Función `public.is_admin()` (`SECURITY DEFINER`, `SET search_path = public`, `STABLE`).
--   3. Registro del email del administrador confirmado por Jack (con guarda que aborta
--      la transacción si `public.admins` queda vacía para nunca bloquear al admin).
--   4. Reemplazo de todas las policies administrativas en `public.*` y `storage.objects`
--      para exigir `public.is_admin()` tanto en `USING` como en `WITH CHECK`.
--   5. Las policies de lectura pública (`SELECT`) y de inserción pública de `pedidos`
--      y `reclamaciones` permanecen intactas.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Tabla de administradores autorizados
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Función verificadora de rol admin (SECURITY DEFINER + search_path fijo)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Registrar al usuario administrador (reemplazar email confirmado por Jack)
-- ----------------------------------------------------------------------------
INSERT INTO public.admins (user_id, email)
SELECT id, email
FROM auth.users
WHERE lower(email) = lower('<EMAIL_ADMIN_CONFIRMADO_POR_JACK>')
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email;

-- Guarda de seguridad: impide aplicar las nuevas policies si ningún usuario quedó en public.admins
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admins) THEN
    RAISE EXCEPTION 'ABORTADO POR SEGURIDAD: public.admins está vacía. Reemplaza <EMAIL_ADMIN_CONFIRMADO_POR_JACK> por el email real del admin en auth.users antes de ejecutar.';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Tablas de catálogo y contenido público (lectura pública intacta, escritura -> is_admin())
-- ----------------------------------------------------------------------------

-- banners
DROP POLICY IF EXISTS "Admin Write banners" ON public.banners;
CREATE POLICY "Admin Write banners"
  ON public.banners
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- categorias
DROP POLICY IF EXISTS "Admin Write categorias" ON public.categorias;
CREATE POLICY "Admin Write categorias"
  ON public.categorias
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- colecciones_home
DROP POLICY IF EXISTS "Admin Write colecciones_home" ON public.colecciones_home;
CREATE POLICY "Admin Write colecciones_home"
  ON public.colecciones_home
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- config
DROP POLICY IF EXISTS "Admin Write config" ON public.config;
CREATE POLICY "Admin Write config"
  ON public.config
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- distritos
DROP POLICY IF EXISTS "Admin Write distritos" ON public.distritos;
CREATE POLICY "Admin Write distritos"
  ON public.distritos
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- faqs
DROP POLICY IF EXISTS "Admin Write faqs" ON public.faqs;
CREATE POLICY "Admin Write faqs"
  ON public.faqs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ocasiones_home
DROP POLICY IF EXISTS "Admin Write ocasiones_home" ON public.ocasiones_home;
CREATE POLICY "Admin Write ocasiones_home"
  ON public.ocasiones_home
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- popup
DROP POLICY IF EXISTS "Admin Write popup" ON public.popup;
CREATE POLICY "Admin Write popup"
  ON public.popup
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- productos
DROP POLICY IF EXISTS "Admin Write productos" ON public.productos;
CREATE POLICY "Admin Write productos"
  ON public.productos
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- tags
DROP POLICY IF EXISTS "tags_escritura_admin" ON public.tags;
CREATE POLICY "tags_escritura_admin"
  ON public.tags
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Tabla `pedidos` (insert_public intacta; select/update/delete -> is_admin())
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_select" ON public.pedidos;
CREATE POLICY "admin_select"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update" ON public.pedidos;
CREATE POLICY "admin_update"
  ON public.pedidos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete" ON public.pedidos;
CREATE POLICY "admin_delete"
  ON public.pedidos
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. Tabla `reclamaciones` (Allow anon insert intacta; admin ALL -> is_admin())
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin select/update to reclamaciones" ON public.reclamaciones;
CREATE POLICY "Allow admin select/update to reclamaciones"
  ON public.reclamaciones
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. Storage (`storage.objects` en buckets banners, categorias, productos, popup)
--    La lectura pública (SELECT) no se toca. INSERT/UPDATE/DELETE exigen is_admin().
-- ----------------------------------------------------------------------------

-- Bucket: banners
DROP POLICY IF EXISTS "admin puede subir banners" ON storage.objects;
CREATE POLICY "admin puede subir banners"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banners'::text AND public.is_admin());

DROP POLICY IF EXISTS "admin puede actualizar banners" ON storage.objects;
CREATE POLICY "admin puede actualizar banners"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'banners'::text AND public.is_admin())
  WITH CHECK (bucket_id = 'banners'::text AND public.is_admin());

DROP POLICY IF EXISTS "admin puede eliminar banners" ON storage.objects;
CREATE POLICY "admin puede eliminar banners"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'banners'::text AND public.is_admin());

-- Bucket: categorias
DROP POLICY IF EXISTS "admin puede subir categorias" ON storage.objects;
CREATE POLICY "admin puede subir categorias"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'categorias'::text AND public.is_admin());

DROP POLICY IF EXISTS "admin puede actualizar categorias" ON storage.objects;
CREATE POLICY "admin puede actualizar categorias"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'categorias'::text AND public.is_admin())
  WITH CHECK (bucket_id = 'categorias'::text AND public.is_admin());

DROP POLICY IF EXISTS "admin puede eliminar categorias" ON storage.objects;
CREATE POLICY "admin puede eliminar categorias"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'categorias'::text AND public.is_admin());

-- Bucket: productos
DROP POLICY IF EXISTS "admin puede subir imagenes" ON storage.objects;
CREATE POLICY "admin puede subir imagenes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'productos'::text AND public.is_admin());

DROP POLICY IF EXISTS "admin puede actualizar imagenes" ON storage.objects;
CREATE POLICY "admin puede actualizar imagenes"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'productos'::text AND public.is_admin())
  WITH CHECK (bucket_id = 'productos'::text AND public.is_admin());

DROP POLICY IF EXISTS "admin puede eliminar imagenes" ON storage.objects;
CREATE POLICY "admin puede eliminar imagenes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'productos'::text AND public.is_admin());

-- Bucket: popup
DROP POLICY IF EXISTS "admin puede subir popup" ON storage.objects;
CREATE POLICY "admin puede subir popup"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'popup'::text AND public.is_admin());

DROP POLICY IF EXISTS "admin puede actualizar popup" ON storage.objects;
CREATE POLICY "admin puede actualizar popup"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'popup'::text AND public.is_admin())
  WITH CHECK (bucket_id = 'popup'::text AND public.is_admin());

DROP POLICY IF EXISTS "admin puede eliminar popup" ON storage.objects;
CREATE POLICY "admin puede eliminar popup"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'popup'::text AND public.is_admin());

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-EJECUCIÓN (SOLO LECTURA)
-- ============================================================================
SELECT count(*)::int AS total_admins FROM public.admins;

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname ASC, tablename ASC, cmd ASC, policyname ASC;

-- ============================================================================
-- ROLLBACK COMPLETO (COMENTADO — restaura exactamente las policies originales)
-- ============================================================================
-- BEGIN;
--
-- -- 1. Restaurar policies en tablas públicas
-- DROP POLICY IF EXISTS "Admin Write banners" ON public.banners;
-- CREATE POLICY "Admin Write banners" ON public.banners FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Admin Write categorias" ON public.categorias;
-- CREATE POLICY "Admin Write categorias" ON public.categorias FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Admin Write colecciones_home" ON public.colecciones_home;
-- CREATE POLICY "Admin Write colecciones_home" ON public.colecciones_home FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Admin Write config" ON public.config;
-- CREATE POLICY "Admin Write config" ON public.config FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Admin Write distritos" ON public.distritos;
-- CREATE POLICY "Admin Write distritos" ON public.distritos FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Admin Write faqs" ON public.faqs;
-- CREATE POLICY "Admin Write faqs" ON public.faqs FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Admin Write ocasiones_home" ON public.ocasiones_home;
-- CREATE POLICY "Admin Write ocasiones_home" ON public.ocasiones_home FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Admin Write popup" ON public.popup;
-- CREATE POLICY "Admin Write popup" ON public.popup FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Admin Write productos" ON public.productos;
-- CREATE POLICY "Admin Write productos" ON public.productos FOR ALL TO public USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "tags_escritura_admin" ON public.tags;
-- CREATE POLICY "tags_escritura_admin" ON public.tags FOR ALL TO public USING (auth.role() = 'authenticated'::text);
--
-- DROP POLICY IF EXISTS "admin_select" ON public.pedidos;
-- CREATE POLICY "admin_select" ON public.pedidos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "admin_update" ON public.pedidos;
-- CREATE POLICY "admin_update" ON public.pedidos FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "admin_delete" ON public.pedidos;
-- CREATE POLICY "admin_delete" ON public.pedidos FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
--
-- DROP POLICY IF EXISTS "Allow admin select/update to reclamaciones" ON public.reclamaciones;
-- CREATE POLICY "Allow admin select/update to reclamaciones" ON public.reclamaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
--
-- -- 2. Restaurar policies en storage.objects
-- DROP POLICY IF EXISTS "admin puede subir banners" ON storage.objects;
-- CREATE POLICY "admin puede subir banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners'::text);
-- DROP POLICY IF EXISTS "admin puede actualizar banners" ON storage.objects;
-- DROP POLICY IF EXISTS "admin puede eliminar banners" ON storage.objects;
-- CREATE POLICY "admin puede eliminar banners" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'banners'::text);
--
-- DROP POLICY IF EXISTS "admin puede subir categorias" ON storage.objects;
-- CREATE POLICY "admin puede subir categorias" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'categorias'::text);
-- DROP POLICY IF EXISTS "admin puede actualizar categorias" ON storage.objects;
-- DROP POLICY IF EXISTS "admin puede eliminar categorias" ON storage.objects;
-- CREATE POLICY "admin puede eliminar categorias" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'categorias'::text);
--
-- DROP POLICY IF EXISTS "admin puede subir imagenes" ON storage.objects;
-- CREATE POLICY "admin puede subir imagenes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'productos'::text);
-- DROP POLICY IF EXISTS "admin puede actualizar imagenes" ON storage.objects;
-- DROP POLICY IF EXISTS "admin puede eliminar imagenes" ON storage.objects;
-- CREATE POLICY "admin puede eliminar imagenes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'productos'::text);
--
-- DROP POLICY IF EXISTS "admin puede subir popup" ON storage.objects;
-- CREATE POLICY "admin puede subir popup" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'popup'::text);
-- DROP POLICY IF EXISTS "admin puede actualizar popup" ON storage.objects;
-- DROP POLICY IF EXISTS "admin puede eliminar popup" ON storage.objects;
-- CREATE POLICY "admin puede eliminar popup" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'popup'::text);
--
-- -- 3. Eliminar función y tabla de admins
-- DROP FUNCTION IF EXISTS public.is_admin();
-- DROP TABLE IF EXISTS public.admins;
--
-- COMMIT;
