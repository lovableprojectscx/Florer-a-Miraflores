-- ==============================================================================
-- VERIFICACIÓN DE ESTADO Y POLICIES EN TABLA PUBLIC.PEDIDOS
-- ==============================================================================
-- Este script es de SOLO LECTURA (SELECT).
-- Permite comprobar si existe alguna restricción CHECK sobre la columna `estado`
-- y auditar las políticas RLS activas sobre la tabla `pedidos`.
-- ==============================================================================

-- 1. Restricciones y CHECKs en la tabla pedidos
SELECT
  conname AS constraint_name,
  contype AS tipo,
  pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid = 'public.pedidos'::regclass
ORDER BY conname;

-- 2. Valores distintos de `estado` actualmente registrados en producción
SELECT
  estado,
  count(*) AS total_pedidos
FROM public.pedidos
GROUP BY estado
ORDER BY total_pedidos DESC;

-- 3. Políticas RLS activas en la tabla pedidos
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pedidos'
ORDER BY policyname;
