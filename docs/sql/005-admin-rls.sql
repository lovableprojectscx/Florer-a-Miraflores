-- =============================================================================
-- 005-admin-rls.sql
-- Fase 03-B — Endurecer seguridad (RLS) en tablas públicas y storage.objects
-- =============================================================================
-- PROPÓSITO:
--   Reemplazar las policies de escritura que hoy usan `auth.uid() IS NOT NULL`,
--   `auth.role() = 'authenticated'` o `TO authenticated USING (true)` por una
--   verificación explícita contra la tabla `public.admins` mediante la función
--   `public.is_admin()`.
--
--   De este modo, SOLO los usuarios registrados en `public.admins` pueden:
--     1. Escribir (INSERT/UPDATE/DELETE) en el catálogo y configuración:
--        banners, categorias, colecciones_home, config, distritos, faqs,
--        ocasiones_home, popup, productos, tags.
--     2. Leer, actualizar o eliminar `pedidos` y `reclamaciones`
--        (manteniendo intacto el INSERT público para compradores anónimos).
--     3. Subir, actualizar o eliminar archivos en `storage.objects`
--        para los buckets `banners`, `categorias`, `productos` y `popup`
--        (manteniendo intacta la lectura pública de imágenes).
--
-- REQUISITO ANTES DE EJECUTAR:
--   Jack debe confirmar el correo exacto del administrador y reemplazar el
--   placeholder `<EMAIL_ADMIN_CONFIRMADO_POR_JACK>` en el bloque de inserción
--   de `public.admins` antes de correr el script.
--   El script incluye dos guardas `DO $$ ... RAISE EXCEPTION` antes del COMMIT:
--     - Guarda 1: aborta si `public.admins` queda vacía.
--     - Guarda 2: recorre `pg_policies` y aborta listando cualquier policy de
--       escritura (o lectura en pedidos/reclamaciones) cuya `qual` o
--       `with_check` no contenga `is_admin()` (salvo las 2 excepciones de
--       INSERT público en `pedidos` y `reclamaciones`).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Tabla `public.admins` (RLS activado, SIN policies públicas)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Ningún rol público/autenticado puede leer ni modificar directamente
-- `public.admins`; solo `public.is_admin()` (SECURITY DEFINER) la consulta.
REVOKE ALL ON TABLE public.admins FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Función `public.is_admin()`
-- -----------------------------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. Alta del usuario administrador confirmado por Jack (Guarda 1)
-- -----------------------------------------------------------------------------
-- IMPORTANTE: Reemplazar '<EMAIL_ADMIN_CONFIRMADO_POR_JACK>' por el email real
-- confirmado por Jack antes de ejecutar.
INSERT INTO public.admins (user_id, email)
SELECT id, email
FROM auth.users
WHERE lower(email) = lower('<EMAIL_ADMIN_CONFIRMADO_POR_JACK>')
ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admins) THEN
    RAISE EXCEPTION 'ABORTADO: public.admins está vacía. Confirma el email del admin en auth.users antes de aplicar las policies.';
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 4. Tablas públicas de catálogo y contenido
--    Nombres reales en pg_policies:
--      - "Admin Write <tabla>" en banners, categorias, colecciones_home,
--        config, distritos, faqs, ocasiones_home, popup, productos
--      - "tags_escritura_admin" en tags
--    Las policies de lectura pública ("Public Read <tabla>" y
--    "tags_lectura_publica") NO se tocan.
-- -----------------------------------------------------------------------------

-- 4.1 banners
DROP POLICY IF EXISTS "Admin Write banners" ON public.banners;
CREATE POLICY "Admin Write banners"
  ON public.banners
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.2 categorias
DROP POLICY IF EXISTS "Admin Write categorias" ON public.categorias;
CREATE POLICY "Admin Write categorias"
  ON public.categorias
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.3 colecciones_home
DROP POLICY IF EXISTS "Admin Write colecciones_home" ON public.colecciones_home;
CREATE POLICY "Admin Write colecciones_home"
  ON public.colecciones_home
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.4 config
DROP POLICY IF EXISTS "Admin Write config" ON public.config;
CREATE POLICY "Admin Write config"
  ON public.config
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.5 distritos
DROP POLICY IF EXISTS "Admin Write distritos" ON public.distritos;
CREATE POLICY "Admin Write distritos"
  ON public.distritos
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.6 faqs
DROP POLICY IF EXISTS "Admin Write faqs" ON public.faqs;
CREATE POLICY "Admin Write faqs"
  ON public.faqs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.7 ocasiones_home
DROP POLICY IF EXISTS "Admin Write ocasiones_home" ON public.ocasiones_home;
CREATE POLICY "Admin Write ocasiones_home"
  ON public.ocasiones_home
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.8 popup
DROP POLICY IF EXISTS "Admin Write popup" ON public.popup;
CREATE POLICY "Admin Write popup"
  ON public.popup
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.9 productos
DROP POLICY IF EXISTS "Admin Write productos" ON public.productos;
CREATE POLICY "Admin Write productos"
  ON public.productos
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.10 tags
DROP POLICY IF EXISTS "tags_escritura_admin" ON public.tags;
CREATE POLICY "tags_escritura_admin"
  ON public.tags
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Tabla `public.pedidos`
--    - `insert_public` NO se toca (excepción permitida para checkout público).
--    - `admin_select`, `admin_update`, `admin_delete` pasan a `public.is_admin()`.
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 6. Tabla `public.reclamaciones`
--    - `"Allow anon insert to reclamaciones"` NO se toca (excepción permitida).
--    - `"Allow admin select/update to reclamaciones"` pasa a `public.is_admin()`.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow admin select/update to reclamaciones" ON public.reclamaciones;
CREATE POLICY "Allow admin select/update to reclamaciones"
  ON public.reclamaciones
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 7. Policies de escritura en `storage.objects`
--    Buckets: `banners`, `categorias`, `productos`, `popup`
--    - Las 4 policies de lectura pública (`lectura publica de ...`) quedan intactas.
--    - Las policies de INSERT, UPDATE y DELETE exigen `public.is_admin()`.
-- -----------------------------------------------------------------------------

-- 7.1 Bucket `banners`
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

-- 7.2 Bucket `categorias`
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

-- 7.3 Bucket `productos`
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

-- 7.4 Bucket `popup`
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

-- -----------------------------------------------------------------------------
-- 8. Guarda 2 ANTES DEL COMMIT:
--    Recorre `pg_policies` y aborta toda la transacción si queda CUALQUIER
--    policy con `cmd <> 'SELECT'` (o `SELECT` en `pedidos`/`reclamaciones`)
--    en las 12 tablas de `public` o en `storage.objects` (buckets banners,
--    categorias, productos, popup) cuya `qual` o `with_check` aplicable NO
--    contenga `is_admin()`, salvo las 2 únicas excepciones permitidas:
--      1. `public.pedidos` -> `insert_public`
--      2. `public.reclamaciones` -> `Allow anon insert to reclamaciones`
--    Nota sobre PostgreSQL `pg_policies`:
--      - En policies `FOR INSERT`, PostgreSQL prohíbe `USING` (`qual` es NULL)
--        y evalúa `with_check`.
--      - En policies `FOR DELETE` y `FOR SELECT`, PostgreSQL prohíbe
--        `WITH CHECK` (`with_check` es NULL) y evalúa `qual`.
--      - En policies `FOR ALL` y `FOR UPDATE`, se exigen AMBAS (`qual` y
--        `with_check` con `is_admin()`).
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_fallos text;
BEGIN
  SELECT string_agg(
    format(
      '%s.%s -> %I (cmd=%s, qual=%s, with_check=%s)',
      schemaname,
      tablename,
      policyname,
      cmd,
      coalesce(qual, 'NULL'),
      coalesce(with_check, 'NULL')
    ),
    E'\n  - '
    ORDER BY schemaname, tablename, policyname
  )
  INTO v_fallos
  FROM pg_policies
  WHERE (
    (
      schemaname = 'public'
      AND tablename IN (
        'banners', 'categorias', 'colecciones_home', 'config',
        'distritos', 'faqs', 'ocasiones_home', 'popup',
        'productos', 'tags', 'pedidos', 'reclamaciones'
      )
    )
    OR (
      schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        coalesce(qual, '') ~ '(banners|categorias|productos|popup)'
        OR coalesce(with_check, '') ~ '(banners|categorias|productos|popup)'
      )
    )
  )
  -- Analizamos todas las policies de escritura (cmd <> 'SELECT') más el SELECT
  -- sobre datos sensibles (pedidos y reclamaciones)
  AND (
    cmd <> 'SELECT'
    OR (schemaname = 'public' AND tablename IN ('pedidos', 'reclamaciones'))
  )
  -- Únicas 2 excepciones permitidas (INSERT público en pedidos y reclamaciones)
  AND NOT (schemaname = 'public' AND tablename = 'pedidos' AND policyname = 'insert_public' AND cmd = 'INSERT')
  AND NOT (schemaname = 'public' AND tablename = 'reclamaciones' AND policyname = 'Allow anon insert to reclamaciones' AND cmd = 'INSERT')
  -- Condición de fallo: falta `is_admin()` en qual o en with_check según el cmd
  AND (
    (cmd IN ('ALL', 'UPDATE') AND (
      coalesce(qual, '') NOT LIKE '%is_admin()%'
      OR coalesce(with_check, '') NOT LIKE '%is_admin()%'
    ))
    OR (cmd = 'INSERT' AND coalesce(with_check, '') NOT LIKE '%is_admin()%')
    OR (cmd IN ('DELETE', 'SELECT') AND coalesce(qual, '') NOT LIKE '%is_admin()%')
  );

  IF v_fallos IS NOT NULL THEN
    RAISE EXCEPTION E'ABORTADO: Quedan policies sin is_admin():\n  - %', v_fallos;
  END IF;
END
$$;

COMMIT;

-- =============================================================================
-- SELECT DE VERIFICACIÓN (ejecutar después del COMMIT)
-- =============================================================================

-- 1. Verificación de cierre: DEBE DEVOLVER 0 FILAS (misma condición de la guarda)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE (
  (
    schemaname = 'public'
    AND tablename IN (
      'banners', 'categorias', 'colecciones_home', 'config',
      'distritos', 'faqs', 'ocasiones_home', 'popup',
      'productos', 'tags', 'pedidos', 'reclamaciones'
    )
  )
  OR (
    schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      coalesce(qual, '') ~ '(banners|categorias|productos|popup)'
      OR coalesce(with_check, '') ~ '(banners|categorias|productos|popup)'
    )
  )
)
AND (
  cmd <> 'SELECT'
  OR (schemaname = 'public' AND tablename IN ('pedidos', 'reclamaciones'))
)
AND NOT (schemaname = 'public' AND tablename = 'pedidos' AND policyname = 'insert_public' AND cmd = 'INSERT')
AND NOT (schemaname = 'public' AND tablename = 'reclamaciones' AND policyname = 'Allow anon insert to reclamaciones' AND cmd = 'INSERT')
AND (
  (cmd IN ('ALL', 'UPDATE') AND (
    coalesce(qual, '') NOT LIKE '%is_admin()%'
    OR coalesce(with_check, '') NOT LIKE '%is_admin()%'
  ))
  OR (cmd = 'INSERT' AND coalesce(with_check, '') NOT LIKE '%is_admin()%')
  OR (cmd IN ('DELETE', 'SELECT') AND coalesce(qual, '') NOT LIKE '%is_admin()%')
)
ORDER BY 1, 2, 3;

-- 2. Listado completo de policies resultante en `public` y `storage`
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY 1, 2, 3;

-- 3. Conteo de administradores registrados
SELECT count(*) AS total_admins FROM public.admins;


-- =============================================================================
-- BLOQUE DE REVERSA (ROLLBACK MANUAL — SOLO EJECUTAR SI SE DESEA REVERTIR)
-- Restaura exactamente todas las policies previas de `public` y `storage.objects`
-- tal como estaban en `pg_policies` antes de la Fase 03-B, y elimina
-- `public.is_admin()` y `public.admins`.
-- =============================================================================
/*
BEGIN;

-- 1. Restaurar policies de catálogo/contenido en `public` (nombres y firmas exactas)
DROP POLICY IF EXISTS "Admin Write banners" ON public.banners;
CREATE POLICY "Admin Write banners"
  ON public.banners
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Write categorias" ON public.categorias;
CREATE POLICY "Admin Write categorias"
  ON public.categorias
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Write colecciones_home" ON public.colecciones_home;
CREATE POLICY "Admin Write colecciones_home"
  ON public.colecciones_home
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Write config" ON public.config;
CREATE POLICY "Admin Write config"
  ON public.config
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Write distritos" ON public.distritos;
CREATE POLICY "Admin Write distritos"
  ON public.distritos
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Write faqs" ON public.faqs;
CREATE POLICY "Admin Write faqs"
  ON public.faqs
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Write ocasiones_home" ON public.ocasiones_home;
CREATE POLICY "Admin Write ocasiones_home"
  ON public.ocasiones_home
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Write popup" ON public.popup;
CREATE POLICY "Admin Write popup"
  ON public.popup
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Write productos" ON public.productos;
CREATE POLICY "Admin Write productos"
  ON public.productos
  FOR ALL
  TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tags_escritura_admin" ON public.tags;
CREATE POLICY "tags_escritura_admin"
  ON public.tags
  FOR ALL
  TO public
  USING (auth.role() = 'authenticated'::text);

-- 2. Restaurar policies de `public.pedidos`
DROP POLICY IF EXISTS "admin_select" ON public.pedidos;
CREATE POLICY "admin_select"
  ON public.pedidos
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_update" ON public.pedidos;
CREATE POLICY "admin_update"
  ON public.pedidos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "admin_delete" ON public.pedidos;
CREATE POLICY "admin_delete"
  ON public.pedidos
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 3. Restaurar policy de `public.reclamaciones`
DROP POLICY IF EXISTS "Allow admin select/update to reclamaciones" ON public.reclamaciones;
CREATE POLICY "Allow admin select/update to reclamaciones"
  ON public.reclamaciones
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Restaurar policies de `storage.objects`
DROP POLICY IF EXISTS "admin puede subir banners" ON storage.objects;
CREATE POLICY "admin puede subir banners"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banners'::text);

DROP POLICY IF EXISTS "admin puede actualizar banners" ON storage.objects;

DROP POLICY IF EXISTS "admin puede eliminar banners" ON storage.objects;
CREATE POLICY "admin puede eliminar banners"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'banners'::text);

DROP POLICY IF EXISTS "admin puede subir categorias" ON storage.objects;
CREATE POLICY "admin puede subir categorias"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'categorias'::text);

DROP POLICY IF EXISTS "admin puede actualizar categorias" ON storage.objects;

DROP POLICY IF EXISTS "admin puede eliminar categorias" ON storage.objects;
CREATE POLICY "admin puede eliminar categorias"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'categorias'::text);

DROP POLICY IF EXISTS "admin puede subir imagenes" ON storage.objects;
CREATE POLICY "admin puede subir imagenes"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'productos'::text);

DROP POLICY IF EXISTS "admin puede actualizar imagenes" ON storage.objects;

DROP POLICY IF EXISTS "admin puede eliminar imagenes" ON storage.objects;
CREATE POLICY "admin puede eliminar imagenes"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'productos'::text);

DROP POLICY IF EXISTS "admin puede subir popup" ON storage.objects;
CREATE POLICY "admin puede subir popup"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'popup'::text);

DROP POLICY IF EXISTS "admin puede actualizar popup" ON storage.objects;

DROP POLICY IF EXISTS "admin puede eliminar popup" ON storage.objects;
CREATE POLICY "admin puede eliminar popup"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'popup'::text);

-- 5. Eliminar función y tabla de administradores
DROP FUNCTION IF EXISTS public.is_admin();
DROP TABLE IF EXISTS public.admins;

COMMIT;
*/
