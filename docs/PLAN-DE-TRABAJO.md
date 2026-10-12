# Plan de Trabajo / Backlog — Florería Miraflores

Lista ordenada y priorizada de pendientes, incluyendo las solicitudes nuevas del cliente. Clasificado por tipo para saber qué necesita código (dev) y qué es contenido/configuración (se hace desde el panel admin).

Última actualización: 2026-10-12

**Tipo:** 🧑‍💻 Código (dev) · ⚙️ Config/contenido (panel) · 🔒 Bloqueado (depende de terceros)
**Prioridad:** P1 antes de lanzar · P2 post-lanzamiento · P3 cuando se pueda

---

## P1 — Antes del lanzamiento

| # | Pedido | Tipo | Nota |
| --- | --- | --- | --- |
| 1 | **Paginación del catálogo** ("Ver más", lotes de 24) | 🧑‍💻 | Plan ya definido. Alivia celular y egress con 300+ productos. |
| 2 | **Fotos del catálogo más grandes y bonitas** (estilo Lima Floral) | 🧑‍💻 | Cambio de layout en `ProductGrid`: tarjetas más grandes, menos columnas, imagen protagonista. |
| 3 | **Arreglar categoría "Nacimientos"** — no se refleja en la web | ⚙️/🧑‍💻 | Investigar: ¿no le deja subir (bug de admin) o está sin productos/inactiva? Primero reproducir el error. |
| 4 | **Dividir "Nacimientos" en Niño y Niña** (subcategorías) | ⚙️ | Crear 2 subcategorías en el panel y asignar productos. Verificar que el admin lo permita. |
| 5 | **"Tulipanes" no se refleja en Ramos y Arreglos** | ⚙️ | Revisar que las subcategorías de Tulipanes (arreglos/ramos/floreros) tengan productos asignados y estén activas. |
| 6 | **Estado "En preparación"** en pedidos | 🧑‍💻 | Añadir al flujo de estados (hoy: pendiente, pagado, en camino, entregado). |

## P2 — Post-lanzamiento (rápido, no bloquea salir al aire)

| # | Pedido | Tipo | Nota |
| --- | --- | --- | --- |
| 7 | **Página de Reseñas y Testimonios** (imágenes + texto + estrellas) | 🧑‍💻 | Opción A (recomendada): testimonios curados cargados desde el panel. Opción B: conectar a Google Maps (ver P3-11). |
| 8 | **Correo automático** al recibir un pedido | 🧑‍💻 | Edge Function + servicio de correo (Resend). Prometido en cotización. |
| 9 | **Botón "Agregar al carrito"** en tarjetas del Home | 🧑‍💻 | RF-017. |
| 10 | **Botón "Compartir"** en tarjetas del Home | 🧑‍💻 | RF-018 (Web Share API / copiar enlace). |

## P3 — Cuando se pueda / depende de terceros

| # | Pedido | Tipo | Nota |
| --- | --- | --- | --- |
| 11 | **Conectar reseñas a Google Maps** | 🔒 | Requiere Google Place ID + API key. La API de Google solo devuelve ~5 reseñas; para más, se usa enlace o se curan manualmente. |
| 12 | **Integración IZIPay** (pago en la web) | 🔒 | Bloqueado por credenciales de Sofía (Sandbox). |

---

## Notas por pedido (detalle y recomendación)

**Reseñas y testimonios (#7, #11).** Lo más sólido es una página propia con testimonios curados (foto del cliente o del arreglo + texto + estrellas), administrable desde el panel. Se ve premium y tú controlas qué se muestra. La conexión directa a Google Maps es posible pero limitada (Google entrega pocas reseñas por API y cambia seguido); lo práctico es un botón "Ver nuestras reseñas en Google" que lleve al perfil, y los testimonios destacados cargados a mano. Recomiendo: página curada ahora, enlace a Google ya, API más adelante si de verdad hace falta.

**Fotos más grandes (#2).** Es un ajuste de diseño del grid: menos columnas, tarjetas altas, imagen que ocupe casi toda la tarjeta (como Lima Floral). Rápido y de alto impacto visual.

**Categorías (#3, #4, #5).** Mayormente es contenido/configuración desde el panel (crear subcategorías, asignar productos, activar). PERO el síntoma "no le deja subir Nacimientos" puede ser un bug del admin — hay que reproducirlo primero. Si es bug, es dev; si es que estaba inactiva o sin productos, es config.

---

## Orden sugerido de ejecución

1. Reproducir y arreglar el tema de categorías (#3, #4, #5) — es lo que bloquea que el catálogo se vea completo.
2. Fotos grandes (#2) + paginación (#1) — van juntas, misma zona de código (`ProductGrid`).
3. Estado "En preparación" (#6).
4. Lanzar al aire. 🚀
5. Luego: página de reseñas (#7), correo (#8), botones del home (#9, #10).
6. Cuando lleguen credenciales: IZIPay (#12).
