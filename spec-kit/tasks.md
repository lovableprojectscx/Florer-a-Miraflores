# Tasks — Florería Miraflores (qué sigue)

Resumen priorizado. Detalle y notas en `../docs/PLAN-DE-TRABAJO.md`.

**Tipo:** 🧑‍💻 código · ⚙️ config/panel · 🔒 bloqueado por terceros

## P1 — Antes de lanzar

- [ ] 🧑‍💻 **Paginación del catálogo** ("Ver más", lotes de 24) en `ProductGrid`. Plan definido.
- [ ] 🧑‍💻 **Fotos del catálogo más grandes** (estilo Lima Floral): tarjetas más grandes, menos columnas.
- [ ] ⚙️/🧑‍💻 **Arreglar "Nacimientos"** (no se refleja en la web): reproducir primero — ¿bug de admin o estaba inactiva/sin productos?
- [ ] ⚙️ **Dividir "Nacimientos" en Niño y Niña** (subcategorías en panel).
- [ ] ⚙️ **"Tulipanes" no se refleja en Ramos/Arreglos**: revisar subcategorías con productos asignados y activas.
- [ ] 🧑‍💻 **Estado "En preparación"** en pedidos (hoy: pendiente, pagado, en camino, entregado, cancelado).

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
