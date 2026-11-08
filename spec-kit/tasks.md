# Tasks — Florería Miraflores (Estado SDD Actualizado)

Resumen priorizado sincronizado con producción (`master`). Detalle completo en [`../docs/REQUISITOS-FUNCIONALES.md`](../docs/REQUISITOS-FUNCIONALES.md) y [`../docs/ACTUALIZACIONES.md`](../docs/ACTUALIZACIONES.md).

**Tipo:** 🧑‍💻 código · ⚙️ config/panel · 🔒 bloqueado por terceros

## P1 — Lanzamiento y Estabilidad Core (100% Completado ✅)

- [x] 🧑‍💻 **Paginación del catálogo** ("Ver más", lotes de 24) en `ProductGrid` (`src/hooks/use-ver-mas.ts`).
- [x] 🧑‍💻 **Proporción cuadrada unificada 1:1 (`aspect-square`)** en catálogo, carruseles del Home y ficha de producto (`RF-009b`, `RF-009c`), con miniaturas WebP `thumbs/480` y `thumbs/960`.
- [x] ⚙️/🧑‍💻 **Taxonomía y redirecciones canónicas** (`Nacimientos` Niño/Niña, `Tulipanes`, `Condolencias` con 4 subcategorías activas, `Orquídeas` padre y `Novedades` en Ocasión — `RF-003a..d`, `RF-118..121`, `SQL 003..015`).
- [x] 🧑‍💻 **Flujo completo de estados de pedido** (`pendiente`, `en_preparacion`, `en_camino`, `entregado`, `pagado`, `cancelado`).
- [x] 🧑‍💻 **Descripciones enriquecidas con Markdown** en ficha de producto y editor con vista previa en Admin (`RF-122`), más ocultación sin borrado (`activo` / `publicado`, `RF-123`).
- [x] 🧑‍💻 **Blindaje de Seguridad RLS + Anti-Tampering de Precios** (`SQL 016`: trigger `trg_pedidos_zz_integridad_precios`, bloqueo de políticas temporales de Storage, `is_admin()` `SECURITY INVOKER` e índices FK — `RNF-05`).
- [x] 🧑‍💻 **Optimización PageSpeed, Storage y File Egress** (`RNF-15`, `RNF-18`): compresión de logo (`-89%`), preload SSR del LCP Hero, `Cache-Control: max-age=31536000` en el 100% de objetos S3, generación del 100% de miniaturas faltantes (`480w`/`960w`) y purga de archivos huérfanos.
- [x] 🧑‍💻 **SEO Técnico, GEO-Targeting Lima y Navegación Agéntica (`2/2`)** (`RF-124`, `RNF-03`, `RNF-04`, `RNF-16`): canonical autorreferencial dinámico, `BreadcrumbList` + `safeJsonLd()`, meta tags `PE-LIM` y `/llms.txt`.
- [x] 🧑‍💻 **Certificación Integral QA Automatizada** (`RNF-17`): suites Vitest Unitarias, RLS en vivo (`16/16`), Playwright E2E multi-dispositivo (incluyendo auditoría de red Storage/Egress/SEO) y prueba de estrés (`> 250 req/s`, `0%` errores).

## P2 — Módulos de Prueba Social y Conversión

- [x] 🧑‍💻 **Página y carrusel de Reseñas/Testimonios reales** (`/resenas` + `/admin/testimonios`, `RF-100..105`).
- [x] 🧑‍💻 **Mural de Recuerdos de Entrega** (`/recuerdos` + `/admin/recuerdos`, `RF-110..117`).
- [x] 🧑‍💻 **Botones rápidos "Agregar al carrito" y "Compartir"** en tarjetas del Home (`RF-017`, `RF-018`).
- [ ] 🔒 **Correo transaccional automático** al recibir pedido (Edge Function + Resend — requiere API key / dominio verificado).

## P3 — Integraciones Externas (Bloqueadas por credenciales de terceros)

- [ ] 🔒 **Integración de pasarela IZIPay** (`RF-040..044` — bloqueado en espera de credenciales comerciales de Sofía; opera hoy vía WhatsApp).
- [ ] 🔒 **Sincronización automática con API Google Maps Places** (opcional; hoy opera con curaduría verificada en `/admin/testimonios`).
