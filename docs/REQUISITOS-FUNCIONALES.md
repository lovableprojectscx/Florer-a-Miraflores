# Requisitos Funcionales — Florería Miraflores

Especificación formal de requisitos, derivada de las peticiones del `CLAUDE.md` (secciones 6, 7, 8, 9, 13, 14) y de la cotización aprobada. Cada requisito tiene ID, prioridad, estado verificado en código y fuente, para usarse como **matriz de trazabilidad** en el análisis.

Última revisión: 2026-09-24

**Leyenda de estado:** ✅ Implementado · ⚠️ Parcial · ❌ Pendiente
**Prioridad:** Alta (bloquea entrega) · Media · Baja

---

## 1. Catálogo y navegación

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-001 | El catálogo muestra productos con imagen, nombre, precio y badge de tag | Alta | ✅ | CLAUDE §9, §7 |
| RF-002 | Imágenes de producto en alta calidad, sin compresión (Supabase Storage) | Alta | ✅ | Cotización 3.1 |
| RF-003 | Navegación por categoría padre → subcategorías → productos | Alta | ✅ | CLAUDE §5, §8 |
| RF-004 | Categorías sin subcategoría (Arreglos Premium, Ofertas) muestran productos directo | Media | ✅ | CLAUDE §7 |
| RF-005 | Nav desktop con dropdown y mobile con acordeón | Media | ✅ | CLAUDE §8 |
| RF-006 | Filtro por rango de precio en listados | Media | ✅ | Cotización 3.1 |
| RF-007 | Ordenamiento de productos (recomendados, precio asc/desc) | Media | ✅ | Cotización 3.1 |
| RF-008 | Listado de productos por tag (novedad, oferta, edición limitada, más vendido) | Media | ✅ | CLAUDE §7 |
| RF-009 | Página de catálogo completo `/catalogo` | Media | ✅ | — (implementado) |

## 2. Producto individual

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-010 | Ficha `/producto/:id` con imagen, breadcrumb, nombre, precio, descripción | Alta | ✅ | CLAUDE §6.2 |
| RF-011 | Badge de tag cuando aplica (solo el primero si hay varios) | Baja | ✅ | CLAUDE §6.2, §7 |
| RF-012 | Selector de cantidad (mínimo 1) | Media | ✅ | CLAUDE §6.2 |
| RF-013 | Botón "Agregar al carrito" abre el drawer | Alta | ✅ | CLAUDE §6.2 |
| RF-014 | Botón "Comprar ahora" navega a checkout | Media | ✅ | CLAUDE §6.2 |
| RF-015 | Nota de delivery por distritos cubiertos | Baja | ✅ | CLAUDE §6.2 |
| RF-016 | Productos relacionados de la misma subcategoría | Baja | ✅ | CLAUDE §6.2 |
| RF-017 | Botón rápido "Agregar al carrito" en tarjetas del Home (`Novedades.tsx`) | Media | ❌ | Solicitud Cliente (Home UI) |
| RF-018 | Botón "Compartir" en tarjetas del Home (`Novedades.tsx`) vía Web Share API o portapapeles | Baja | ❌ | Solicitud Cliente (Home UI) |

> **Detalle RF-017 (Agregar al carrito en Home):** Permite añadir 1 unidad al carrito global (Zustand) directamente desde el carrusel de inicio sin navegar a la ficha `/producto/:id`. Desencadena la apertura del `CartDrawer` con feedback inmediato.
>
> **Detalle RF-018 (Compartir en Home):** Activa el diálogo nativo `navigator.share` en dispositivos compatibles (móviles/tablets) para compartir en WhatsApp, Instagram, Telegram o apps de mensajería; en caso de navegadores de escritorio sin soporte nativo, copia la URL canónica del producto al portapapeles con notificación visual de éxito.

## 3. Carrito

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-020 | Carrito global en Zustand, persistente durante la navegación, en memoria (sin BD) | Alta | ✅ | CLAUDE §6.1 |
| RF-021 | Drawer lateral con overlay, lista de items, miniatura, precio, cantidad ± y eliminar | Alta | ✅ | CLAUDE §6.1 |
| RF-022 | Contador de items en el ícono del header | Media | ✅ | CLAUDE §6.1 |
| RF-023 | Footer del drawer con subtotal y "Ir al checkout" | Alta | ✅ | CLAUDE §6.1 |
| RF-024 | Estado vacío con mensaje y CTA a catálogo | Baja | ✅ | CLAUDE §6.1 |

## 4. Checkout y delivery por distritos

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-030 | Redirect a home si el carrito está vacío | Media | ✅ | CLAUDE §6.3 |
| RF-031 | Formulario datos del cliente (nombre, teléfono +51, email) | Alta | ✅ | CLAUDE §6.3 |
| RF-032 | Formulario de entrega (distrito, dirección, referencia, fecha, hora, notas) | Alta | ✅ | CLAUDE §6.3 |
| RF-033 | Al elegir distrito se aplica automáticamente su costo de delivery al total | Alta | ✅ | Cotización 3.2 |
| RF-034 | Resumen del pedido con subtotal + delivery + total | Alta | ✅ | CLAUDE §6.3 |
| RF-035 | Validaciones inline (campos requeridos, email válido, teléfono ≥9 dígitos) | Alta | ✅ | CLAUDE §6.3 |
| RF-036 | Registro del pedido en BD con número `FM-XXXXXX` y estado inicial | Alta | ✅ | CLAUDE §6.3 |

## 5. Pago (IZIPay)

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-040 | El cliente paga con IZIPay directamente desde la web | **Alta** | ❌ | Cotización 3.3 |
| RF-041 | Confirmación automática del pago antes de procesar el pedido | **Alta** | ❌ | Cotización 3.3 |
| RF-042 | Integración vía Edge Function (credenciales nunca en frontend) | **Alta** | ❌ | CLAUDE §10, §16 |
| RF-043 | Webhook que actualiza el pedido a "pagado" | **Alta** | ❌ | CLAUDE §10 |
| RF-044 | Ambientes Sandbox y Producción separados | Alta | ❌ | CLAUDE §10 |

> Estado actual: el checkout registra el pedido y coordina el pago por WhatsApp. Bloqueado por credenciales IZIPay de Sofía.

## 6. Confirmación

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-050 | Página `/confirmacion` con número de pedido, resumen y datos de entrega | Alta | ✅ | CLAUDE §6.4 |
| RF-051 | Redirect a home si se accede sin pedido | Baja | ✅ | CLAUDE §6.4 |
| RF-052 | CTA a WhatsApp con el número de pedido | Media | ✅ | CLAUDE §6.4 |

## 7. Panel de administración

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-060 | Login admin y protección de rutas `/admin/*` (sin sesión → login) | Alta | ✅ | CLAUDE §12 |
| RF-061 | CRUD de productos (crear, editar, eliminar, fotos, precios, activo) | Alta | ✅ | CLAUDE §13, Cotización 3.4 |
| RF-062 | CRUD de categorías y colecciones del home | Alta | ✅ | CLAUDE §13 |
| RF-063 | Gestión de distritos y tarifas de delivery | Alta | ✅ | Cotización 3.2 |
| RF-064 | Gestión de banners, popup, ocasiones y tags del home | Media | ✅ | CLAUDE §13 |
| RF-065 | Vista de pedidos con detalle (cliente, productos, distrito, monto) | Alta | ✅ | Cotización 3.4 |
| RF-066 | Cambio de estado del pedido con un clic | Alta | ✅ | Cotización 3.4 |
| RF-067 | Config general (WhatsApp, correo, horario, redes, libro reclamaciones) | Media | ✅ | CLAUDE §13, §15 |
| RF-068 | Upload de imágenes a Storage con preview | Media | ✅ | CLAUDE §13 |
| RF-069 | Reordenamiento con flechas ↑↓ y toggle activo inline | Baja | ✅ | CLAUDE §13 |

## 7.1. Promociones, Popup y Fidelización

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-064a | Listón lateral permanente de suscripción en color rosa característico Miraflores (`#C4848A`) | Media | ✅ | Solicitud Cliente (Fidelización) |
| RF-064b | Popup modal de captura de celular (+51) con control de frecuencia (máx 1 vez por sesión) y prevención de duplicados | Media | ✅ | Solicitud Cliente (Fidelización) |

> **Detalle RF-064a (Listón lateral rosa):** Elemento visual permanente posicionado en el lateral izquierdo (`fixed left-0 top-1/2 -translate-y-1/2 z-40`) con el color rosa distintivo de Florería Miraflores (`#C4848A` / `--rose-accent`). Muestra verticalmente el llamado *"Suscríbete para recibir ofertas y novedades"* con ícono de regalo. Al hacer clic, abre de inmediato el popup modal de suscripción, permitiendo a los clientes acceder a las promociones en cualquier momento sin depender de la apertura automática.
>
> **Detalle RF-064b (Popup de captura de celular y frecuencia):**
> 1. **Control de frecuencia:** El popup solo se abrirá automáticamente 1 vez por sesión de navegación (`sessionStorage.getItem("fm_popup_seen")`), con una espera no intrusiva de 3 segundos tras cargar la página. No vuelve a abrirse al cambiar de ruta (`/` ↔ `/catalogo`) ni tras refrescar en la misma sesión.
> 2. **Captura de número móvil:** Permite al visitante registrar su teléfono peruano de 9 dígitos (+51) para unirse a la lista de ofertas y promociones exclusivas vía WhatsApp o SMS.
> 3. **Estado de éxito y cupón:** Al registrarse, el modal entrega un cupón de bienvenida con opción de copiado rápido y un botón directo a WhatsApp para canjearlo con atención personalizada.
> 4. **Persistencia de suscriptor:** Si el usuario ya se suscribió, se almacena en `localStorage` (`fm_subscribed`) para no volver a interrumpirlo de forma automática jamás.

## 8. Estados del pedido

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-070 | Estado "Recibido" (pedido y pago confirmados) | Media | ⚠️ | Cotización §2 |
| RF-071 | Estado "En preparación" | Media | ❌ | Cotización §2 |
| RF-072 | Estado "En camino" | Media | ✅ | Cotización §2 |
| RF-073 | Estado "Entregado" | Media | ✅ | Cotización §2 |

> Estados actuales en código: `pendiente, pagado, en_camino, entregado, cancelado`. Falta **"En preparación"**; "Recibido" no coincide 1:1 con el naming (`pendiente`/`pagado`).

## 9. Notificaciones

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-080 | Notificación por correo al recibir un nuevo pedido | **Alta** | ❌ | Cotización 3.4 |
| RF-081 | (Fase 3) Aviso al admin + correo al cliente tras pago exitoso | Media | ❌ | CLAUDE §10 |

## 10. Libro de reclamaciones

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-090 | Página `/libro-de-reclamaciones` con formulario | Media | ✅ | CLAUDE §5 |
| RF-091 | Gestión de reclamaciones desde el admin | Baja | ✅ | CLAUDE §13 |

---

## 11. Requisitos No Funcionales (RNF)

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RNF-01 | Diseño responsivo (celular, tablet, escritorio) | Alta | ✅ | Cotización 3.1 |
| RNF-02 | Identidad de marca (colores, logo, estética premium femenina) | Alta | ✅ | Cotización 3.1, CLAUDE §4 |
| RNF-03 | SEO: meta tags por ruta, Open Graph, `robots.txt` excluye `/admin` | Media | ⚠️ | CLAUDE §14 |
| RNF-04 | Schema.org `Florist`/`LocalBusiness` en home | Baja | ⚠️ | CLAUDE §14 |
| RNF-05 | Seguridad: RLS en todas las tablas; secrets solo server-side | Alta | ✅ | CLAUDE §3, §11 |
| RNF-06 | Imágenes con `loading="lazy"` salvo above-the-fold, y `alt` descriptivo | Media | ⚠️ | CLAUDE §14, §18 |
| RNF-07 | Feedback de errores al usuario (toasts), sin `console.log` en prod | Media | ⚠️ | CLAUDE §18 |
| RNF-08 | Dominio propio incluido primer año | Media | — | Cotización 3.5 (operativo) |
| RNF-09 | Manual de uso + capacitación 1h + 1 mes soporte | Media | ❌ | Cotización 3.5 (entregable de servicio) |

> RNF-03/04/06/07 marcados ⚠️ porque no se verificaron a fondo en esta revisión; conviene auditarlos en el análisis.

---

## 12. Resumen para el análisis

**Bloqueantes de entrega (Alta, pendientes):**
- RF-040 a RF-044 — **IZIPay** (bloqueado por credenciales de Sofía).
- RF-080 — **Correo automático** al recibir pedido.

**Brechas menores (Media):**
- RF-071 — Estado **"En preparación"**.
- RF-070 — Alinear naming del estado "Recibido".

**Nuevas solicitudes de UI / Conversión (Home):**
- RF-017 — **Agregar al carrito** directo desde tarjeta en carrusel de Home.
- RF-018 — **Compartir** producto desde tarjeta en carrusel de Home (Web Share API / Portapapeles).
- RF-064a — **Listón lateral rosa** permanente en borde izquierdo (`#C4848A`) para invocar promociones en cualquier momento.
- RF-064b — **Popup de captura de celular** (+51) con frecuencia optimizada (1 sola vez por sesión, sin duplicación).

**Por auditar (⚠️):** SEO (RNF-03/04), lazy-load y alts (RNF-06), manejo de errores (RNF-07).

**Entregables de servicio (no de código):** manual, capacitación y soporte (RNF-09).

El resto del sistema (catálogo, filtros, producto, carrito, checkout con delivery, confirmación, panel admin completo, Supabase + RLS) está ✅ implementado y verificado.
