# PROMPT 01 — Base de pruebas: Vitest + Playwright + verificación

> Fase de cimientos. Va **primero** porque todas las fases siguientes entregan con tests. No cambia nada visible para el cliente.

---

## Objetivo

Hoy el proyecto **no tiene ni un test** (no hay vitest, playwright ni testing-library instalados). Monta la base de pruebas, cubre lo que ya existe y deja un comando único `npm run verify` que certifique el sistema.

Rama: `fase-01-base-pruebas`. Antes de crearla, haz lo de la sección 4 del Prompt 00 (gitignore de `CON FONDO HECHO 4K/` + commit de docs).

## 1. Instalar (devDependencies)

`vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@playwright/test`. Luego `npx playwright install chromium`.

## 2. Vitest

- Crea `vitest.config.ts` **separado** usando `defineConfig` de `vitest/config` con `@vitejs/plugin-react` y `vite-tsconfig-paths` (ya están instalados). **No importes** `@lovable.dev/vite-tanstack-config` (arrastra cloudflare y tanstackStart y rompe los tests).
- `environment: "jsdom"`, `setupFiles: ["./tests/setup.ts"]` (importa `@testing-library/jest-dom/vitest`), `include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"]`, excluye `tests/e2e` y `tests/rls`.
- Supabase en tests unitarios: siempre con `vi.mock("@/lib/supabase")`. Ningún test unitario sale a la red.
- Coverage con v8, reporte en `coverage/` (agrégalo a `.gitignore`).

### Tests unitarios mínimos (sobre código que YA existe)

| Archivo a probar | Qué cubrir |
| --- | --- |
| `src/store/cart.ts` | agregar item nuevo, agregar existente suma cantidad, quitar, `actualizarCantidad` ignora < 1, vaciar, `total()` y `totalItems()` |
| `src/lib/utils.ts` | `slugify` (tildes, ñ, espacios, símbolos, guiones repetidos), `extractIdFromSlug` (UUID solo, slug-UUID, fallback) |
| `src/lib/tag-utils.ts` | `resolverClavesTag`, `findTagByClave`, `getTagBadgeInfo` con tag inexistente/undefined |
| `src/components/ProductFilters.tsx` | `useProductFilters`: orden precio asc/desc, cada rango de precio, lista vacía |
| Checkout (validación) | Extrae `checkoutSchema` y `getFechaMinima` de `src/routes/checkout.tsx` a `src/lib/checkout-schema.ts` **sin cambiar su comportamiento** y pruébalo: teléfono < 9 dígitos, letras en teléfono, email inválido, hora fuera del enum, fecha de hoy rechazada. *(Hay un bug de zona horaria en `getFechaMinima`; NO lo arregles aquí, va en la Fase 05. Escribe el test que lo demuestra y márcalo `it.fails` con un comentario `// Bug conocido, se arregla en Fase 05`.)* |
| `src/lib/queries.ts` | `crearPedido` con supabase mockeado: genera número `FM-` + 6 dígitos, inserta `estado: "pendiente"`, lanza error legible si Supabase devuelve error |

## 3. Playwright (E2E)

- `playwright.config.ts` con `testDir: "tests/e2e"`, `webServer` levantando `npm run dev` (averigua el puerto real que usa el dev server, la config de Lovable puede fijarlo; **no asumas 5173**) y `reuseExistingServer: true`.
- Dos proyectos: **`mobile`** (`devices["Pixel 7"]`) y **`desktop`** (`devices["Desktop Chrome"]`, 1440×900).
- `trace: "on-first-retry"`, `screenshot: "only-on-failure"`, reporte HTML en `playwright-report/` (al `.gitignore`, igual que `test-results/`).
- Fixture común en `tests/e2e/fixtures.ts` que **falle el test si hay `console.error` o `pageerror`** en la página (con una lista blanca documentada si algo de terceros molesta).

### Regla de oro de datos en E2E

La BD es producción. Por eso:
- Las pruebas **leen** datos reales (catálogo, categorías) pero **nunca escriben**.
- En el checkout, intercepta con `page.route("**/rest/v1/pedidos*", ...)` y responde `201` vacío para que **no** se cree un pedido real. Verifica en el test que la interceptación ocurrió.
- Tests de admin: credenciales en `.env.e2e.local` (`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`; ya está cubierto por `*.local` en `.gitignore`). Si no existen, esos tests hacen `test.skip` con un mensaje claro. Solo lectura por defecto. Cualquier test que escriba debe ir detrás de `E2E_ALLOW_WRITES=1`, usar nombres con prefijo `[E2E]` y borrar lo que creó en `afterAll`.

### Suite E2E inicial (`tests/e2e/`)

1. `smoke.spec.ts` — cargan sin errores y con `<title>` correcto: `/`, `/catalogo`, `/nosotros`, `/libro-de-reclamaciones`, una `/categoria/:slug` real y un `/producto/:id` real (sácalos del catálogo, no los hardcodees). Ruta inexistente muestra "no encontrado".
2. `catalogo.spec.ts` — hay productos; el filtro de categoría cambia el contador; el orden por precio ordena de verdad (lee los precios de las tarjetas).
3. `carrito.spec.ts` — agregar desde tarjeta abre el drawer, el contador del header sube, +/- cambia el subtotal, eliminar vacía y muestra "Tu carrito está vacío".
4. `checkout.spec.ts` — carrito vacío redirige a `/`; con carrito: errores inline al enviar vacío; elegir distrito suma delivery al total; envío válido (con la interceptación) llega a `/confirmacion` con número `FM-XXXXXX` y botón de WhatsApp con ese número en el enlace.
5. `admin.spec.ts` — `/admin` sin sesión redirige al login; con credenciales (si hay): login OK, el sidebar navega a cada sección sin errores.

## 4. RLS (seguridad) — `tests/rls/`

Proyecto Vitest aparte (`vitest.rls.config.ts`, environment `node`) que usa el **anon key real** desde `.env.local`:
- anon **puede** leer `productos`, `categorias`, `banners`, `distritos`, `config`.
- anon **no puede** insertar/actualizar/borrar en `productos` ni `categorias` (ojo: un UPDATE/DELETE bloqueado por RLS no da error, devuelve 0 filas; verifica con `.select()` que no afectó nada, y apunta a un id inexistente para no tocar datos aunque la policy estuviera mal).
- anon **no puede** leer `pedidos` (debe volver vacío o error).
- **No** pruebes el INSERT público de `pedidos` (crearía un pedido real).

## 5. Scripts en `package.json`

```
"typecheck": "tsc --noEmit",
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:rls": "vitest run -c vitest.rls.config.ts",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"verify": "npm run lint && npm run typecheck && npm run test && npm run build"
```

Si `typecheck` o `lint` fallan por código viejo, **no lo silencies con ignores masivos**: arregla lo trivial y lista el resto en el reporte con archivo y línea.

## 6. CI (opcional, pregunta a Jack antes de push)

`.github/workflows/verify.yml`: en push/PR corre `npm ci`, `npm run verify`. Necesita los secrets `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en GitHub; anótalo en "Acciones para Jack". E2E en CI queda fuera por ahora.

## 7. Documentación

- Crea `docs/TESTING.md`: cómo correr cada suite, qué cubre cada archivo, la regla de oro de datos, cómo crear `.env.e2e.local`, cómo leer el reporte de Playwright.
- Agrega una entrada en `docs/ACTUALIZACIONES.md` y enlaza `TESTING.md` desde `docs/README.md`.

## Criterios de aceptación

- [ ] `npm run verify` pasa.
- [ ] `npm run test:e2e` pasa en mobile y desktop (los de admin pueden quedar `skipped` si no hay credenciales, con mensaje claro).
- [ ] `npm run test:rls` pasa.
- [ ] Ningún test crea, edita ni borra datos reales (demuéstralo: explica cómo lo garantizaste).
- [ ] `docs/TESTING.md` creado.

Entrega el reporte con el formato del Prompt 00.
