# Plan técnico — Florería Miraflores (cómo está construido)

## Stack real (verificado en código)

| Capa | Tecnología |
| --- | --- |
| UI | React 19 + Tailwind CSS v4 |
| Framework / Router | TanStack Start + TanStack Router (file-based en `src/routes/`) — SSR-capable |
| Data | TanStack React Query + funciones en `src/lib/queries.ts` |
| Formularios | React Hook Form + Zod |
| Estado global | Zustand (`src/store/cart.ts`) — solo carrito, en memoria |
| Backend/BD | Supabase (PostgreSQL, Storage, Auth, RLS) |
| Build/Deploy | Vite 7 → Vercel (bridge `api/index.js` → `dist/server/server.js`) |
| Pasarela | IZIPay (pendiente de integrar) |

> ⚠️ El `CLAUDE.md` §3 dice "SPA + React Router sin SSR" — es incorrecto respecto al código. El real es TanStack Start.

## Estructura (resumen)

```
src/
├── routes/        rutas públicas + admin/ (panel)
├── components/    UI (Header, Hero, ProductGrid, CartDrawer, ProductFilters, Footer...) + ui/ (shadcn)
├── lib/           supabase.ts, queries.ts (toda la BD), image-optimizer.ts, utils.ts
├── store/cart.ts  carrito Zustand
├── types/database.ts
└── server.ts / start.ts  entradas SSR y cliente
```

Detalle completo con diagramas: `../docs/ARQUITECTURA.md`.

## Base de datos

Tablas: config, banners, popup, categorias (auto-referencia padre/hijo), productos, ocasiones_home, colecciones_home, distritos, pedidos. RLS: lectura pública del catálogo, escritura solo admin, pedidos INSERT público. Detalle: `../docs/BASE-DE-DATOS.md`.

## Decisiones y notas de rendimiento

- Imágenes con `loading="lazy"` → no se descargan todas de golpe. Están en Storage, no en la BD.
- El catálogo hoy trae todos los productos de una (filtros en cliente). Con 300+ conviene **paginar "Ver más"** (plan en `../docs/PLAN-DE-TRABAJO.md` #1). El límite real a cuidar es el **egress de Storage** (plan free de Supabase ~5GB/mes) y el **peso de las fotos**.

## Variables de entorno

```
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY   (frontend, protegidas por RLS)
IZIPAY_* , IZIPAY_BASE_URL                   (solo servidor / Edge Functions — Fase 3)
```
