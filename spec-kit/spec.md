# Spec — Florería Miraflores (qué es y qué hace)

## Resumen

Tienda online de flores y regalos con catálogo dinámico, carrito, checkout con delivery por distritos y panel de administración. ~300 productos cargados. En preparación para lanzamiento.

## Usuarios

- **Cliente final:** navega el catálogo, agrega al carrito, hace checkout, coordina pago (hoy por WhatsApp; a futuro IZIPay).
- **Admin (Sofía / marketing):** gestiona todo desde el panel sin tocar código.

## Rutas públicas

- `/` Home (barra de anuncio, banner slider, colecciones Bento, novedades, marca).
- `/catalogo` catálogo completo con filtros (categoría, ocasión, precio, orden).
- `/categoria/:slug` y `/categoria/:slug/:sub` navegación por categorías/subcategorías.
- `/producto/:id` ficha de producto (galería, precio, descripción, agregar/comprar, relacionados).
- `/nosotros` página de marca.
- `/checkout` datos de cliente + entrega, cálculo de delivery por distrito, registro del pedido.
- `/confirmacion` número de pedido + resumen + WhatsApp.
- `/libro-de-reclamaciones`.

## Panel admin (`/admin/*`)

Login protegido. CRUD de: productos, categorías, colecciones del home, ocasiones, banners, popup, distritos y tarifas, pedidos (con cambio de estado), tags, config general y libro de reclamaciones. Upload de imágenes a Storage, reordenar con flechas, toggle activo inline.

## Flujos clave

- **Checkout:** cliente llena datos → elige distrito (se aplica delivery) → se registra el pedido con número `FM-XXXXXX` y estado inicial → confirmación + WhatsApp. (El pago real por IZIPay está pendiente.)
- **Estados del pedido:** pendiente, pagado, en camino, entregado, cancelado. **Falta "En preparación"** (pedido del cliente).

## Alcance de requisitos

La matriz completa con estado (✅/⚠️/❌) está en `../docs/REQUISITOS-FUNCIONALES.md`. Las mejoras y pedidos nuevos pendientes están en `../docs/PLAN-DE-TRABAJO.md` y resumidos en `tasks.md`.

## Marca e imágenes

- Identidad y logo: `../brand/README.md`, `../brand/logo/`, `../brand/tokens.css`.
- Generación de fotos de producto y banners con IA (Flow / Nano Banana): `../brand/PROMPT-MAESTRO-FOTOS.md` y `../brand/PROMPT-MAESTRO-BANNERS.md`.
