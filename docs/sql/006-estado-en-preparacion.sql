-- ==============================================================================
-- MIGRACIÓN 006: RESTRICCIÓN CHECK PARA ESTADOS DE PEDIDOS
-- ==============================================================================
-- IMPORTANTE:
-- Córrelo SOLO si la verificación mostró que existe un CHECK restrictivo que impide
-- guardar 'en_preparacion', o si se desea formalizar en la base de datos la
-- validación de integridad para los 6 estados oficiales de pedidos:
--   1. 'pendiente'       (Recibido)
--   2. 'en_preparacion'  (En preparación)
--   3. 'en_camino'       (En camino)
--   4. 'entregado'       (Entregado)
--   5. 'pagado'          (Auxiliar: Pagado)
--   6. 'cancelado'       (Auxiliar: Cancelado)
--
-- Idempotente y reversible.
-- NO EJECUTAR hasta que Jack o el revisor indiquen "SQL 006 aprobado por el revisor".
-- ==============================================================================

BEGIN;

-- Agregar la restricción CHECK con los 6 estados permitidos
ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_estado_check
  CHECK (estado IN ('pendiente', 'en_preparacion', 'en_camino', 'entregado', 'pagado', 'cancelado'));

COMMIT;

-- ==============================================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- ==============================================================================
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.pedidos'::regclass
--   AND conname = 'pedidos_estado_check';

-- ==============================================================================
-- BLOQUE DE REVERSA (ROLLBACK)
-- ==============================================================================
-- BEGIN;
-- ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;
-- COMMIT;
