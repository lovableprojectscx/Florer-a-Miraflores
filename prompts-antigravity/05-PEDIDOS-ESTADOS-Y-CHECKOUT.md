# PROMPT 05 — Pedidos: certificar "En preparación" + blindar el checkout

> El backlog dice que falta el estado "En preparación", pero **ya está en el código**. Esta fase confirma que funciona de punta a punta (incluida la BD) y corrige dos bugs reales del checkout.

---

Rama: `fase-05-pedidos-checkout`.

## 1. Estado "En preparación" (verificar, no rehacer)

Ya existe (commit `7de1af5`) en `src/types/database.ts` (`EstadoPedido` con `en_preparacion`), `src/routes/admin/pedidos.tsx` (ESTADOS, badges, labels) y `src/routes/admin/dashboard.tsx`. Flujo: Recibido (`pendiente`) → En preparación → En camino → Entregado; `pagado` y `cancelado` auxiliares.

Lo que falta certificar es **la base de datos**: si `pedidos.estado` tiene un `CHECK` que no incluye `en_preparacion`, el cambio de estado falla en producción.

1. Prepara `docs/sql/verificar-estado-pedidos.sql` (solo SELECT) con:
   `select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.pedidos'::regclass;`
   y la consulta de policies de `pedidos` (`pg_policies`), para que Jack lo corra.
2. Deja listo, **por si hace falta**, `docs/sql/0XX-estado-en-preparacion.sql` idempotente que reemplaza el CHECK por uno con los 6 estados. Indica claramente "córrelo SOLO si la verificación mostró que falta".
3. En `admin/pedidos.tsx`: si el `update` de estado falla, el usuario debe ver un `toast.error` con el motivo (revisa `handleUpdate`); hoy confirma qué pasa. Y un `toast.success("Pedido FM-XXXXXX → En preparación")` al guardar.
4. Revisa que el orden del `<select>` de estados siga el flujo real del negocio.

## 2. Bug: fecha mínima de entrega con zona horaria equivocada

`getFechaMinima()` (hoy en `src/routes/checkout.tsx`, o en `src/lib/checkout-schema.ts` si la Fase 01 ya lo movió) hace `new Date()` + 1 día y luego `toISOString()`, que convierte a **UTC**. Lima es UTC−5: desde las **7:00 p. m.** la "fecha mínima" salta a **pasado mañana**, y un cliente que compra de noche no puede elegir mañana. Además, en SSR el servidor (Vercel, UTC) puede calcular otro valor que el navegador.

- Calcula "mañana" en la zona `America/Lima` explícitamente (con `Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" })` o `date-fns`, que ya está instalado). Úsalo tanto para el `min` del input como para la validación de zod.
- Convierte en test normal el `it.fails` que dejó la Fase 01. Con `vi.setSystemTime` prueba: 10:00 Lima, 18:59 Lima, 19:00 Lima, 23:59 Lima, y 31 de diciembre 21:00 Lima → siempre el día siguiente en Lima.

## 3. Bug potencial: número de pedido repetido

`crearPedido` (`src/lib/queries.ts`) genera `FM-` + 6 dígitos al azar. `numero` es `UNIQUE`: si se repite, el insert falla y el cliente ve un error al pagar.
- Reintenta hasta 3 veces con un número nuevo **solo** cuando el error es de duplicado (código `23505`); cualquier otro error se lanza igual que hoy.
- Si a los 3 intentos falla, mensaje claro al cliente con la opción de WhatsApp.
- Tests unitarios con supabase mockeado: éxito al primer intento; duplicado y luego éxito; 3 duplicados → error; error distinto de 23505 → no reintenta.

## 4. Riesgo a documentar (NO implementar sin OK de Jack)

El pedido se inserta con `subtotal`, `delivery` y `total` calculados en el navegador, y el INSERT es público. Alguien con conocimientos podría registrar un pedido con precios alterados. Hoy el pago se coordina por WhatsApp, así que el riesgo se controla revisando el pedido antes de cobrar. Escribe en `docs/SEGURIDAD.md` (créalo si no existe) el riesgo, la mitigación actual (revisión manual) y la propuesta futura (trigger en BD que recalcule los montos desde `productos` y `distritos`, o insertar vía Edge Function; obligatorio antes de IZIPay). Incluye el borrador del trigger como SQL **comentado**, sin aplicarlo.

## 5. Tests E2E

- `checkout.spec.ts` (ampliar): con el reloj del navegador fijado (`page.clock`) a las 20:00 de Lima, el `min` del input de fecha es **mañana**; elegir hoy muestra el error.
- `admin-pedidos.spec.ts` (con credenciales; si no hay, `skip` con mensaje): el filtro "En preparación" existe y filtra; el detalle muestra el selector con los 6 estados. Cambiar el estado de un pedido real **solo** con `E2E_ALLOW_WRITES=1` y sobre un pedido de prueba creado por Jack con nombre `[E2E]`; si no existe, `skip`.

## 6. Documentación

- `docs/BASE-DE-DATOS.md`: estados válidos y el CHECK.
- `docs/ACTUALIZACIONES.md`, `docs/INCIDENCIAS-Y-SOLUCIONES.md` (los 2 bugs: síntoma, causa, arreglo).
- `spec-kit/tasks.md`: marca "Estado En preparación" como hecho y deja anotado si dependía del SQL.
- `spec-kit/spec.md`: corrige la frase "Falta En preparación".

## Criterios de aceptación

- [ ] Jack tiene el SQL de verificación y sabe qué hacer según el resultado.
- [ ] La fecha mínima es "mañana en Lima" a cualquier hora (tests con reloj fijo).
- [ ] Número de pedido con reintento ante duplicado (tests).
- [ ] Riesgo de montos documentado en `docs/SEGURIDAD.md`.
- [ ] `npm run verify` y `npm run test:e2e` pasan.

Entrega el reporte del Prompt 00.
