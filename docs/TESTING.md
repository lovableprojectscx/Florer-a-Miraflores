# Guía de Pruebas y Verificación — Florería Miraflores

Este documento describe la arquitectura de pruebas automatizadas del proyecto: **pruebas unitarias (Vitest)**, **pruebas de políticas de seguridad RLS (Vitest Node)** y **pruebas End-to-End en navegador real (Playwright)** para móvil (`Pixel 7`) y escritorio (`Desktop Chrome 1440×900`).

---

## 1. Comandos disponibles (`package.json`)

| Comando | Descripción |
| --- | --- |
| `npm run verify` | **Certificación completa antes de cerrar una fase:** corre `lint` + `typecheck` + `test` (unitarios) + `build` de producción. |
| `npm run test` | Ejecuta la suite de pruebas unitarias con Vitest (`vitest.config.ts`, entorno `jsdom`). |
| `npm run test:watch` | Ejecuta Vitest en modo interactivo (watch). |
| `npm run test:coverage` | Genera reporte de cobertura con `@vitest/coverage-v8` en la carpeta `coverage/`. |
| `npm run test:rls` | Ejecuta las pruebas de seguridad Row Level Security (`vitest.rls.config.ts`, entorno `node`) usando la `VITE_SUPABASE_ANON_KEY` real. |
| `npm run test:e2e` | Ejecuta la suite E2E de Playwright en ambos proyectos (`mobile` y `desktop`), levantando automáticamente `npm run dev` en `http://localhost:8080`. |
| `npm run test:e2e:ui` | Abre la interfaz visual interactiva de Playwright para depurar tests paso a paso. |
| `npm run typecheck` | Verifica tipos estáticos de TypeScript (`tsc --noEmit`). |
| `npm run lint` | Ejecuta ESLint + Prettier sobre el repositorio. |

---

## 2. Regla de oro de datos (Producción protegida)

El proyecto cuenta con un único entorno de Supabase (`sdrkiomeesoctsxeidmu`) que corresponde a **producción**. Por lo tanto, **ninguna prueba automatizada puede crear, modificar ni eliminar datos reales**:

1. **Tests unitarios (`tests/unit/`):**
   - Nunca salen a la red. El cliente `@/lib/supabase` se reemplaza siempre mediante `vi.mock("@/lib/supabase")`.
2. **Tests RLS (`tests/rls/`):**
   - Usan la `anon key` real únicamente para comprobar que las lecturas públicas permitidas funcionan (`productos`, `categorias`, `banners`, `distritos`, `config`), que la lectura de `pedidos` está bloqueada para `anon`, y que cualquier intento de `INSERT`, `UPDATE` o `DELETE` con `anon` en `productos` o `categorias` es rechazado o afecta `0` filas (apuntando siempre al UUID inexistente `00000000-0000-0000-0000-000000000000`).
   - **No se prueba `INSERT` en `pedidos`** desde RLS para no insertar pedidos falsos en la base de datos de producción.
3. **Tests E2E (`tests/e2e/`):**
   - Navegan y leen el catálogo real en vivo, pero **nunca escriben en la base de datos**.
   - En `tests/e2e/checkout.spec.ts`, toda petición `POST` hacia `**/rest/v1/pedidos*` es interceptada con `page.route(...)` devolviendo `201 Created` simulado (`[]`), y el test verifica explícitamente que la interceptación ocurrió (`interceptedCount === 1`).
   - En `tests/e2e/admin.spec.ts`, las pruebas son **estrictamente de solo lectura** por defecto. Cualquier prueba futura que requiera escritura deberá protegerse detrás de `E2E_ALLOW_WRITES=1`, usar el prefijo `[E2E]` y limpiar los registros en `afterAll`.

---

## 3. Cobertura por archivo

### 3.1 Pruebas Unitarias (`tests/unit/`)

| Archivo de prueba | Módulo probado | Qué verifica |
| --- | --- | --- |
| `tests/unit/cart.test.ts` | `src/store/cart.ts` | Agregar ítem nuevo, acumular cantidad en ítem existente, quitar ítem, ignorar cantidades `< 1` en `actualizarCantidad`, vaciar carrito, cálculos `total()` / `totalItems()` y apertura/cierre del drawer. |
| `tests/unit/utils.test.ts` | `src/lib/utils.ts` | `slugify` (tildes, `ñ`, mayúsculas, caracteres especiales y guiones múltiples) y `extractIdFromSlug` (UUID directo, `slug-UUID`, IDs estáticos de fallback). |
| `tests/unit/tag-utils.test.ts` | `src/lib/tag-utils.ts` | `resolverClavesTag` (alias históricos de globos), `findTagByClave` (exacto, alias, nulo/inexistente) y `getTagBadgeInfo` (color personalizado y fallback `#2C2420`). |
| `tests/unit/product-filters.test.ts` | `src/components/ProductFilters.tsx` | Hook `useProductFilters`: lista vacía, ordenamiento ascendente/descendente por precio y filtrado por cada rango (`0-100`, `100-200`, `200-300`, `300+`, `todos`). |
| `tests/unit/checkout-schema.test.ts` | `src/lib/checkout-schema.ts` | Validación Zod de `checkoutSchema`: teléfono `< 9` dígitos, letras en teléfono, email inválido, horario fuera del enum, rechazo de fecha de hoy, y test documentado (`it.fails`) del bug de zona horaria UTC en `getFechaMinima` después de las 19:00 hora Lima (programado para corregirse en Fase 05). |
| `tests/unit/queries.test.ts` | `src/lib/queries.ts` | `crearPedido` con Supabase mockeado: generación de código `FM-XXXXXX`, inserción con `estado: "pendiente"` y propagación legible de errores de Supabase. |

### 3.2 Pruebas de Seguridad RLS (`tests/rls/`)

| Archivo de prueba | Qué verifica |
| --- | --- |
| `tests/rls/rls.test.ts` | Lectura pública con `anon` en `productos`, `categorias`, `banners`, `distritos` y `config`; bloqueo de escritura (`INSERT`/`UPDATE`/`DELETE`) con `anon` en `productos` y `categorias`; bloqueo de lectura (`SELECT`) con `anon` en `pedidos`. |

### 3.3 Pruebas End-to-End (`tests/e2e/`)

Todas las pruebas E2E usan el fixture `tests/e2e/fixtures.ts`, que **falla automáticamente el test si ocurre cualquier `console.error` o `pageerror` no permitido** durante la navegación.

| Archivo de prueba | Qué verifica (en `mobile` Pixel 7 y `desktop` 1440×900) |
| --- | --- |
| `tests/e2e/smoke.spec.ts` | Carga sin errores y `<title>` correcto en `/`, `/catalogo`, `/nosotros`, `/libro-de-reclamaciones`, una `/categoria/:slug` real y un `/producto/:id` real extraídos dinámicamente del catálogo. Verifica además la respuesta ante rutas inexistentes (404 / no encontrado). |
| `tests/e2e/catalogo.spec.ts` | Presencia de tarjetas de producto en `/catalogo`, actualización real del contador al filtrar por categoría y verificación numérica del ordenamiento por precio (`precio_asc` y `precio_desc`). |
| `tests/e2e/carrito.spec.ts` | Agregar producto desde tarjeta del catálogo abre el `CartDrawer`, incrementa el badge del `Header`, modifica cantidades (`+`/`-`) recalculando el subtotal y elimina el producto mostrando el estado vacío `"Tu carrito está vacío"`. |
| `tests/e2e/checkout.spec.ts` | Redirección a `/` cuando el carrito está vacío; validación de errores inline al enviar el formulario vacío; suma del costo de delivery al seleccionar distrito; envío válido con interceptación de red (`POST /rest/v1/pedidos`) hasta llegar a `/confirmacion` con código `FM-XXXXXX` y botón de WhatsApp con dicho código. |
| `tests/e2e/admin.spec.ts` | Redirección de `/admin/dashboard` a `/admin-login` cuando no hay sesión. Si existen credenciales en `.env.e2e.local`, inicia sesión y recorre todas las secciones del sidebar verificando que carguen sin errores. |

---

## 4. Configuración de `.env.e2e.local` (Opcional para pruebas de Admin)

Para ejecutar el test autenticado de `tests/e2e/admin.spec.ts`, crea un archivo `.env.e2e.local` en la raíz del proyecto (ya ignorado en Git por la regla `*.local` de `.gitignore`):

```env
E2E_ADMIN_EMAIL=admin@floreriamiraflores.com
E2E_ADMIN_PASSWORD=tu_password_aqui
```

Si `.env.e2e.local` no existe o las variables están vacías, el test de login admin se marca como `skipped` automáticamente con un mensaje explicativo, mientras que el test de protección de ruta (`/admin` sin sesión → `/admin-login`) se ejecuta siempre.

---

## 5. Cómo inspeccionar el reporte de Playwright

Después de correr `npm run test:e2e`, Playwright genera un reporte HTML interactivo en `playwright-report/`. Para abrirlo en el navegador:

```bash
npx playwright show-report
```

Si algún test falla, encontrarás en `test-results/` la captura de pantalla automática (`screenshot: "only-on-failure"`) y, en caso de reintento, la traza completa (`trace: "on-first-retry"`) visualizable con `npx playwright show-trace <ruta-al-trace.zip>`.
