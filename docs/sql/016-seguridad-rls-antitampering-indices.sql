-- ============================================================================
-- SQL 016: Blindaje RLS Storage, Trigger Anti-Tampering Pedidos e Índices FK
-- Fecha: 2026-11-08 | Aplicado y verificado en producción (sdrkiomeesoctsxeidmu)
-- ============================================================================

-- 1. Restringir políticas temporales de Storage únicamente a administradores autenticados
ALTER POLICY "allow_temp_upload_productos"
  ON storage.objects
  TO authenticated
  WITH CHECK ((bucket_id = 'productos'::text) AND public.is_admin());

ALTER POLICY "allow_temp_update_productos"
  ON storage.objects
  TO authenticated
  USING ((bucket_id = 'productos'::text) AND public.is_admin())
  WITH CHECK ((bucket_id = 'productos'::text) AND public.is_admin());

-- 2. Normalizar Cache-Control a 1 año en objetos de Storage
UPDATE storage.objects
   SET metadata = jsonb_set(metadata, '{cacheControl}', '"max-age=31536000"', true)
 WHERE bucket_id IN ('productos', 'banners', 'categorias', 'blog', 'popup', 'testimonios')
   AND metadata IS NOT NULL
   AND (metadata->>'cacheControl' IS DISTINCT FROM 'max-age=31536000');

-- 3. Endurecer public.admins y convertir public.is_admin() a SECURITY INVOKER
GRANT SELECT (user_id) ON public.admins TO anon, authenticated;

CREATE POLICY "admins_select_own_row"
  ON public.admins
  FOR SELECT
  TO public
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = (SELECT auth.uid())
  );
$function$;

-- 4. Índices de cobertura para Foreign Keys (Supabase Performance Advisor)
CREATE INDEX IF NOT EXISTS idx_categorias_parent_id ON public.categorias (parent_id);
CREATE INDEX IF NOT EXISTS idx_colecciones_home_categoria_id ON public.colecciones_home (categoria_id);
CREATE INDEX IF NOT EXISTS idx_ocasiones_home_categoria_id ON public.ocasiones_home (categoria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_distrito_id ON public.pedidos (distrito_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON public.productos (categoria_id);

-- 5. Trigger BEFORE INSERT Anti-Tampering real en PostgreSQL para public.pedidos
CREATE OR REPLACE FUNCTION public.pedidos_integridad_y_precios()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_item jsonb;
  v_prod_id uuid;
  v_qty integer;
  v_db_precio numeric;
  v_db_nombre text;
  v_subtotal numeric := 0;
  v_delivery numeric := 0;
  v_productos_limpios jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    NEW.estado := 'pendiente';
    NEW.izi_transaction_id := NULL;

    IF NEW.productos IS NULL OR jsonb_typeof(NEW.productos) <> 'array' OR jsonb_array_length(NEW.productos) = 0 THEN
      RAISE EXCEPTION 'El pedido debe contener al menos un producto válido'
        USING ERRCODE = '22023';
    END IF;

    FOR v_item IN SELECT value FROM jsonb_array_elements(NEW.productos)
    LOOP
      IF jsonb_typeof(v_item) <> 'object' OR COALESCE(v_item->>'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RAISE EXCEPTION 'ID de producto inválido en el pedido'
          USING ERRCODE = '22023';
      END IF;

      v_prod_id := (v_item->>'id')::uuid;

      BEGIN
        v_qty := COALESCE((v_item->>'cantidad')::integer, 1);
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Cantidad de producto inválida'
          USING ERRCODE = '22023';
      END;

      IF v_qty < 1 OR v_qty > 100 THEN
        RAISE EXCEPTION 'Cantidad de producto fuera de rango permitido (1-100)'
          USING ERRCODE = '22023';
      END IF;

      SELECT p.precio, p.nombre
        INTO v_db_precio, v_db_nombre
        FROM public.productos p
       WHERE p.id = v_prod_id
         AND p.activo = true;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'El producto solicitado (%) no existe o no se encuentra disponible', v_prod_id
          USING ERRCODE = '22023';
      END IF;

      v_subtotal := v_subtotal + (v_db_precio * v_qty);

      v_productos_limpios := v_productos_limpios || jsonb_build_array(
        v_item || jsonb_build_object(
          'precio', ROUND(v_db_precio, 2),
          'nombre', v_db_nombre,
          'cantidad', v_qty
        )
      );
    END LOOP;

    IF NEW.distrito_id IS NULL THEN
      RAISE EXCEPTION 'Debe seleccionar un distrito de entrega válido'
        USING ERRCODE = '22023';
    END IF;

    SELECT d.precio_delivery
      INTO v_delivery
      FROM public.distritos d
     WHERE d.id = NEW.distrito_id
       AND d.activo = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El distrito de entrega seleccionado no es válido o no tiene cobertura activa'
        USING ERRCODE = '22023';
    END IF;

    NEW.productos := v_productos_limpios;
    NEW.subtotal := ROUND(v_subtotal, 2);
    NEW.delivery := ROUND(COALESCE(v_delivery, 0), 2);
    NEW.total := ROUND(v_subtotal + COALESCE(v_delivery, 0), 2);

    IF NEW.notas = '__RLS_TAMPER_DRY_RUN__' THEN
      RAISE EXCEPTION 'ANTI_TAMPER_VERIFIED:subtotal=%|delivery=%|total=%|estado=%',
        NEW.subtotal, NEW.delivery, NEW.total, NEW.estado
        USING ERRCODE = 'P0099';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_pedidos_zz_integridad_precios
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.pedidos_integridad_y_precios();
