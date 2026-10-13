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
-- NOTA DE IDEMPOTENCIA:
--   Usa `ALTER POLICY` sobre las policies existentes (y `DO $$ IF NOT EXISTS`
--   para las 4 policies nuevas de UPDATE en `storage.objects`), de modo que
--   es 100% idempotente y ejecutable por `apply_migration` sin sentencias
--   destructivas (`DROP`/`DELETE`) que bloqueen la ejecución no interactiva.
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
-- 3. Alta del usuario administrador único confirmado por Jack (Guarda 1)
--    Admin único: pedidos@floreriamiraflores.com
--    (test_admin_temp@floreriamiraflores.com NO se agrega a public.admins)
-- -----------------------------------------------------------------------------
INSERT INTO public.admins (user_id, email)
SELECT id, email
FROM auth.users
WHERE lower(email) = 'pedidos@floreriamiraflores.com'
ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email;

DO $$
DECLARE
  v_count integer;
  v_email text;
BEGIN
  SELECT count(*), min(lower(email))
  INTO v_count, v_email
  FROM public.admins;

  IF v_count <> 1 OR v_email <> 'pedidos@floreriamiraflores.com' THEN
    RAISE EXCEPTION 'ABORTADO: public.admins debe tener exactamente 1 fila con pedidos@floreriamiraflores.com (actual: count=%, email=%)', v_count, coalesce(v_email, 'NULL');
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 4. Tablas públicas de catálogo y contenido (idempotente vía ALTER POLICY)
--    Nombres reales en pg_policies:
--      - "Admin Write <tabla>" en banners, categorias, colecciones_home,
--        config, distritos, faqs, ocasiones_home, popup, productos
--      - "tags_escritura_admin" en tags
--    Las policies de lectura pública ("Public Read <tabla>" y
--    "tags_lectura_publica") NO se tocan.
-- -----------------------------------------------------------------------------

-- 4.1 banners
ALTER POLICY "Admin Write banners"
  ON public.banners
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.2 categorias
ALTER POLICY "Admin Write categorias"
  ON public.categorias
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.3 colecciones_home
ALTER POLICY "Admin Write colecciones_home"
  ON public.colecciones_home
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.4 config
ALTER POLICY "Admin Write config"
  ON public.config
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.5 distritos
ALTER POLICY "Admin Write distritos"
  ON public.distritos
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.6 faqs
ALTER POLICY "Admin Write faqs"
  ON public.faqs
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.7 ocasiones_home
ALTER POLICY "Admin Write ocasiones_home"
  ON public.ocasiones_home
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.8 popup
ALTER POLICY "Admin Write popup"
  ON public.popup
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.9 productos
ALTER POLICY "Admin Write productos"
  ON public.productos
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4.10 tags
ALTER POLICY "tags_escritura_admin"
  ON public.tags
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- 5. Tabla `public.pedidos`
--    - `insert_public` NO se toca (excepción permitida para checkout público).
--    - `admin_select`, `admin_update`, `admin_delete` pasan a `public.is_admin()`.
-- -----------------------------------------------------------------------------
ALTER POLICY "admin_select"
  ON public.pedidos
  TO authenticated
  USING (public.is_admin());

ALTER POLICY "admin_update"
  ON public.pedidos
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER POLICY "admin_delete"
  ON public.pedidos
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- 6. Tabla `public.reclamaciones`
--    - `"Allow anon insert to reclamaciones"` NO se toca (excepción permitida).
--    - `"Allow admin select/update to reclamaciones"` pasa a `public.is_admin()`.
-- -----------------------------------------------------------------------------
ALTER POLICY "Allow admin select/update to reclamaciones"
  ON public.reclamaciones
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
ALTER POLICY "admin puede subir banners"
  ON storage.objects
  TO authenticated
  WITH CHECK (bucket_id = 'banners'::text AND public.is_admin());

ALTER POLICY "admin puede eliminar banners"
  ON storage.objects
  TO authenticated
  USING (bucket_id = 'banners'::text AND public.is_admin());

-- 7.2 Bucket `categorias`
ALTER POLICY "admin puede subir categorias"
  ON storage.objects
  TO authenticated
  WITH CHECK (bucket_id = 'categorias'::text AND public.is_admin());

ALTER POLICY "admin puede eliminar categorias"
  ON storage.objects
  TO authenticated
  USING (bucket_id = 'categorias'::text AND public.is_admin());

-- 7.3 Bucket `productos`
ALTER POLICY "admin puede subir imagenes"
  ON storage.objects
  TO authenticated
  WITH CHECK (bucket_id = 'productos'::text AND public.is_admin());

ALTER POLICY "admin puede eliminar imagenes"
  ON storage.objects
  TO authenticated
  USING (bucket_id = 'productos'::text AND public.is_admin());

-- 7.4 Bucket `popup`
ALTER POLICY "admin puede subir popup"
  ON storage.objects
  TO authenticated
  WITH CHECK (bucket_id = 'popup'::text AND public.is_admin());

ALTER POLICY "admin puede eliminar popup"
  ON storage.objects
  TO authenticated
  USING (bucket_id = 'popup'::text AND public.is_admin());

-- 7.5 Policies de UPDATE en `storage.objects` (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede actualizar banners') THEN
    CREATE POLICY "admin puede actualizar banners"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'banners'::text AND public.is_admin())
      WITH CHECK (bucket_id = 'banners'::text AND public.is_admin());
  ELSE
    ALTER POLICY "admin puede actualizar banners"
      ON storage.objects
      TO authenticated
      USING (bucket_id = 'banners'::text AND public.is_admin())
      WITH CHECK (bucket_id = 'banners'::text AND public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede actualizar categorias') THEN
    CREATE POLICY "admin puede actualizar categorias"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'categorias'::text AND public.is_admin())
      WITH CHECK (bucket_id = 'categorias'::text AND public.is_admin());
  ELSE
    ALTER POLICY "admin puede actualizar categorias"
      ON storage.objects
      TO authenticated
      USING (bucket_id = 'categorias'::text AND public.is_admin())
      WITH CHECK (bucket_id = 'categorias'::text AND public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede actualizar imagenes') THEN
    CREATE POLICY "admin puede actualizar imagenes"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'productos'::text AND public.is_admin())
      WITH CHECK (bucket_id = 'productos'::text AND public.is_admin());
  ELSE
    ALTER POLICY "admin puede actualizar imagenes"
      ON storage.objects
      TO authenticated
      USING (bucket_id = 'productos'::text AND public.is_admin())
      WITH CHECK (bucket_id = 'productos'::text AND public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'admin puede actualizar popup') THEN
    CREATE POLICY "admin puede actualizar popup"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'popup'::text AND public.is_admin())
      WITH CHECK (bucket_id = 'popup'::text AND public.is_admin());
  ELSE
    ALTER POLICY "admin puede actualizar popup"
      ON storage.objects
      TO authenticated
      USING (bucket_id = 'popup'::text AND public.is_admin())
      WITH CHECK (bucket_id = 'popup'::text AND public.is_admin());
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 8. Guarda 2 ANTES DEL COMMIT:
--    Recorre `pg_policies` y aborta toda la transacción si queda CUALQUIER
--    policy con `cmd <> 'SELECT'` (o `SELECT` en `pedidos`/`reclamaciones`)
--    en las 12 tablas de `public` o en `storage.objects` (buckets banners,
--    categorias, productos, popup) cuya `qual` o `with_check` aplicable NO
--    contenga `is_admin()`, salvo las 2 únicas excepciones permitidas:
--      1. `public.pedidos` -> `insert_public`
--      2. `public.reclamaciones` -> `Allow anon insert to reclamaciones`
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
    OR (cmd NOT IN ('ALL', 'UPDATE', 'INSERT') AND coalesce(qual, '') NOT LIKE '%is_admin()%')
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
  OR (cmd NOT IN ('ALL', 'UPDATE', 'INSERT') AND coalesce(qual, '') NOT LIKE '%is_admin()%')
)
ORDER BY 1, 2, 3;

-- 2. Conteo y listado de administradores registrados
SELECT email FROM public.admins;


-- =============================================================================
-- BLOQUE DE REVERSA (ROLLBACK MANUAL — SOLO EJECUTAR SI SE DESEA REVERTIR)
-- Restaura exactamente todas las policies previas de `public` y `storage.objects`
-- tal como estaban en `pg_policies` antes de la Fase 03-B, y elimina
-- `public.is_admin()` y `public.admins`.
-- =============================================================================
/*
BEGIN;

-- 1. Restaurar policies de catálogo/contenido en `public` (nombres y firmas exactas)
ALTER POLICY "Admin Write banners"
  ON public.banners
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "Admin Write categorias"
  ON public.categorias
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "Admin Write colecciones_home"
  ON public.colecciones_home
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "Admin Write config"
  ON public.config
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "Admin Write distritos"
  ON public.distritos
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "Admin Write faqs"
  ON public.faqs
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "Admin Write ocasiones_home"
  ON public.ocasiones_home
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "Admin Write popup"
  ON public.popup
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "Admin Write productos"
  ON public.productos
  TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (NULL);

ALTER POLICY "tags_escritura_admin"
  ON public.tags
  TO public
  USING (auth.role() = 'authenticated'::text)
  WITH CHECK (NULL);

-- 2. Restaurar policies de `public.pedidos`
ALTER POLICY "admin_select"
  ON public.pedidos
  TO authenticated
  USING (auth.uid() IS NOT NULL);

ALTER POLICY "admin_update"
  ON public.pedidos
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

ALTER POLICY "admin_delete"
  ON public.pedidos
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 3. Restaurar policy de `public.reclamaciones`
ALTER POLICY "Allow admin select/update to reclamaciones"
  ON public.reclamaciones
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Restaurar policies de `storage.objects`
ALTER POLICY "admin puede subir banners"
  ON storage.objects
  TO authenticated
  WITH CHECK (bucket_id = 'banners'::text);

ALTER POLICY "admin puede eliminar banners"
  ON storage.objects
  TO authenticated
  USING (bucket_id = 'banners'::text);

ALTER POLICY "admin puede subir categorias"
  ON storage.objects
  TO authenticated
  WITH CHECK (bucket_id = 'categorias'::text);

ALTER POLICY "admin puede eliminar categorias"
  ON storage.objects
  TO authenticated
  USING (bucket_id = 'categorias'::text);

ALTER POLICY "admin puede subir imagenes"
  ON storage.objects
  TO authenticated
  WITH CHECK (bucket_id = 'productos'::text);

ALTER POLICY "admin puede eliminar imagenes"
  ON storage.objects
  TO authenticated
  USING (bucket_id = 'productos'::text);

ALTER POLICY "admin puede subir popup"
  ON storage.objects
  TO authenticated
  WITH CHECK (bucket_id = 'popup'::text);

ALTER POLICY "admin puede eliminar popup"
  ON storage.objects
  TO authenticated
  USING (bucket_id = 'popup'::text);

DROP POLICY IF EXISTS "admin puede actualizar banners" ON storage.objects;
DROP POLICY IF EXISTS "admin puede actualizar categorias" ON storage.objects;
DROP POLICY IF EXISTS "admin puede actualizar imagenes" ON storage.objects;
DROP POLICY IF EXISTS "admin puede actualizar popup" ON storage.objects;

-- 5. Eliminar función y tabla de administradores
DROP FUNCTION IF EXISTS public.is_admin();
DROP TABLE IF EXISTS public.admins;

COMMIT;
*/
