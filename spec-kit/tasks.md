# Tasks — Florería Miraflores (qué sigue)

Resumen priorizado. Detalle y notas en `../docs/PLAN-DE-TRABAJO.md`.

**Tipo:** 🧑‍💻 código · ⚙️ config/panel · 🔒 bloqueado por terceros

## P1 — Antes de lanzar

- [x] 🧑‍💻 **Paginación del catálogo** ("Ver más", lotes de 24) en `ProductGrid` (`src/hooks/use-ver-mas.ts`). Aplicada en catálogo, categoría, subcategoría y tag (relacionados no paginan).
- [x] 🧑‍💻 **Fotos del catálogo más grandes** (estilo Lima Floral): tarjetas `aspect-[4/5]`, 2 columnas en móvil, 3 en `md` y máximo 4 en `xl`, con `decoding="async"`, `sizes` y placeholder explícito.
- [x] ⚙️/🧑‍💻 **Arreglar "Nacimientos"** (no se refleja en la web): diagnosticado en Fase 02 y resuelto en Fase 03 (pasa a categoría padre con redirección de `/categoria/ocasion/nacimientos`, ocultamiento automático de categorías vacías y `docs/sql/003-nacimientos-padre.sql`).
- [x] ⚙️ **Dividir "Nacimientos" en Niño y Niña** (`nacimientos-nino` y `nacimientos-nina` en `docs/sql/003-nacimientos-padre.sql` + guía en `docs/GUIA-PANEL-CATEGORIAS.md`).
- [x] ⚙️ **"Tulipanes" no se refleja en Ramos/Arreglos**: selector agrupado `Padre › Hija` en `/admin/productos`, ocultamiento de subcategorías vacías y `docs/sql/004-tulipanes-reasignacion.sql` + guía para reasignar los 13 productos de Tulipanes padre.
- [x] 🧑‍💻 **Estado "En preparación"** en pedidos: verificado de punta a punta en Fase 05 (selector de 6 estados ordenados según flujo real de negocio, toast con feedback y tests E2E; verificado por MCP en BD que no había restricción CHECK bloqueante; `docs/sql/006-estado-en-preparacion.sql` listo por si a futuro se desea constraint explícito).

## P2 — Post-lanzamiento (no bloquea)

- [ ] 🧑‍💻 **Página de Reseñas/Testimonios** (imágenes + texto + estrellas, administrable). Enlace a Google ya; API después.
- [ ] 🧑‍💻 **Correo automático** al recibir pedido (Edge Function + Resend).
- [ ] 🧑‍💻 **Botón "Agregar al carrito"** en tarjetas del Home (RF-017).
- [ ] 🧑‍💻 **Botón "Compartir"** en tarjetas del Home (RF-018).

## P3 — Cuando se pueda

- [ ] 🔒 **Reseñas desde Google Maps** (necesita Place ID + API key; Google entrega pocas por API).
- [ ] 🔒 **Integración IZIPay** (bloqueado: faltan credenciales Sandbox de Sofía).

## Orden sugerido

1. Destrabar categorías (#3–#5).
2. Fotos grandes + paginación (misma zona: `ProductGrid`).
3. Estado "En preparación".
4. **Lanzar.**
5. Reseñas, correo, botones del home.
6. IZIPay cuando lleguen credenciales.
