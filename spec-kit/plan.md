# Plan técnico — Florería Miraflores (SDD: cómo está construido)

## Stack real verificado en código (`v1.14.0`)

| Capa               | Tecnología                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| UI                 | React 19 + Tailwind CSS v4 + `react-markdown`                                                   |
| Framework / Router | TanStack Start (`v1.168.60`) + TanStack Router (`src/routes/`) — SSR activo en Vercel           |
| Data & Caché       | Funciones tipadas en `src/lib/queries.ts` con caché en memoria (TTL 60s) + Edge CDN (`api/`)    |
| Formularios        | React Hook Form + Zod (`checkout-schema.ts`, validaciones inline)                               |
| Estado global      | Zustand (`src/store/cart.ts`) — carrito reactivo en memoria del navegador                       |
| Backend / BD       | Supabase Plan Pro (`sa-east-1`, PostgreSQL 17.6, 14 tablas con RLS estricto + triggers SQL 016) |
| Storage & CDN      | Supabase Storage S3 + Cloudflare CDN (`thumbs/480`, `thumbs/960`, `Cache-Control: 1 año`)       |
| Testing & QA       | Vitest (Unit + RLS en vivo contra Supabase) + Playwright E2E (`mobile` Pixel 7 + `desktop` 1440)|
| Build / Deploy     | Vite 7 → Vercel Serverless (`api/index.js` → `dist/server/server.js`) + `vercel.json`           |
| Pasarela           | Flujo WhatsApp activo; IZIPay preparado para Edge Functions (pendiente credenciales)            |

> ⚠️ El `CLAUDE.md` §3 menciona originalmente "SPA + React Router sin SSR"; la arquitectura productiva real es **TanStack Start con SSR**.

## Estructura principal

```
src/
├── routes/        rutas públicas SSR + admin/ (15 módulos protegidos)
├── components/    UI (Header, Hero, ResponsiveImage, ProductGrid, ProductDetailView, PopupModal...)
├── lib/           supabase.ts, queries.ts, image-optimizer.ts, image-utils.ts, categorias-utils.ts, utils.ts
├── store/cart.ts  carrito Zustand en memoria
├── types/         database.ts (esquema tipado completo)
└── server.ts / start.ts  entradas SSR y cliente
```

Detalle arquitectónico completo: [`../docs/ARQUITECTURA.md`](../docs/ARQUITECTURA.md).

## Seguridad, Base de Datos y Anti-Tampering (`SQL 005` + `SQL 016`)

- **RLS total (14 tablas + Storage):** Escrituras administrativas restringidas por `public.is_admin()` (`SECURITY INVOKER`, sin advertencias en Supabase Security Advisor) y políticas temporales de Storage bloqueadas a `authenticated` + `is_admin()`.
- **Integridad de precios en servidor:** Trigger PostgreSQL `trg_pedidos_zz_integridad_precios` (`public.pedidos_integridad_y_precios()`) recalcula `subtotal` desde `public.productos`, `delivery` desde `public.distritos` y `total` antes de cada `INSERT`, forzando `estado = 'pendiente'` y anulando cualquier intento de manipulación desde cliente.
- **Índices FK completos:** 100% de llaves foráneas indexadas (`idx_productos_categoria_id`, `idx_pedidos_distrito_id`, `idx_categorias_parent_id`, `idx_colecciones_home_categoria_id`, `idx_ocasiones_home_categoria_id`).

## Gobernanza de Storage, Cache-Control y File Egress (`RNF-15`)

- **Triple resolución WebP:** Todo activo en `productos`, `categorias`, `banners`, `testimonios`, `recuerdos` y `popup` cuenta con `thumbs/480` (~17 KB), `thumbs/960` (~49 KB) y original optimizado (`<= 1600px` en catálogo, `2560px` en Hero).
- **Caché inmutable en S3 y navegador:** Cabecera real `Cache-Control: public, max-age=31536000` (1 año) en todos los objetos de Storage, eliminando re-descargas (`no-cache`) y manteniendo el presupuesto de carga inicial de `/catalogo` por debajo de `1.2 MB` (0 errores `4xx` en `/thumbs/`).
- **Cero huérfanos:** Purga certificada de archivos sin referencia en BD y limpieza automática desde `/admin/productos` y `/admin/popup` al eliminar registros exclusivos.

## Variables de entorno

```
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY       (frontend y SSR público, protegidas por RLS + Triggers)
E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD             (solo local en .env.e2e.local, ignorado en Git)
IZIPAY_* , IZIPAY_BASE_URL                      (solo servidor / Edge Functions — Fase 3)
```
