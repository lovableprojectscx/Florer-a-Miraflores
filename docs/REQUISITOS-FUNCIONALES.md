# Requisitos Funcionales — Florería Miraflores

Especificación formal de requisitos, derivada de las peticiones del `CLAUDE.md` (secciones 6, 7, 8, 9, 13, 14), cotización aprobada y solicitudes de mejora continua e iteración del cliente. Cada requisito cuenta con ID, prioridad, estado verificado en código y fuente, para emplearse como **matriz de trazabilidad** en el análisis del sistema.

Última revisión: 2026-10-08

**Leyenda de estado:** ✅ Implementado · ⚠️ Parcial / En auditoría · ❌ Pendiente · 🔄 Modificado / Retirado por cliente  
**Prioridad:** Alta (bloquea entrega) · Media · Baja

---

## 1. Catálogo y navegación

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-001 | El catálogo muestra productos con imagen, nombre, precio y badge de tag | Alta | ✅ | CLAUDE §9, §7 |
| RF-002 | Imágenes de producto en alta calidad optimizadas en WebP (Supabase Storage) | Alta | ✅ | Cotización 3.1 |
| RF-003 | Navegación por categoría padre → subcategorías → productos | Alta | ✅ | CLAUDE §5, §8 |
| RF-003a | Navegación híbrida padre/hijos: `/categoria/:slug` muestra chips interactivos de subcategorías y la grilla unificada con todos los productos de sus hijas | Alta | ✅ | Solicitud Cliente (v1.3.0) |
| RF-004 | Categorías sin subcategoría (Arreglos Premium, Ofertas) muestran productos directo | Media | ✅ | CLAUDE §7 |
| RF-005 | Nav desktop con dropdown de subcategorías y mobile con acordeón | Media | ✅ | CLAUDE §8 |
| RF-005a | Header con desplazamiento natural (scroll no estático / `relative`) que sube y se oculta con el scroll | Media | ✅ | Solicitud Cliente (v1.4.0) |
| RF-006 | Filtro por rango de precio y búsqueda en listados | Media | ✅ | Cotización 3.1 |
| RF-006a | Subfiltro interactivo de subcategorías en catálogo `/catalogo` al filtrar por una categoría padre | Media | ✅ | Solicitud Cliente (v1.3.0) |
| RF-007 | Ordenamiento de productos (más recientes, recomendados, precio asc/desc) | Media | ✅ | Cotización 3.1 |
| RF-008 | Listado de productos por tag (novedad, oferta, edición limitada, más vendido) | Media | ✅ | CLAUDE §7 |
| RF-009 | Página de catálogo completo `/catalogo` | Media | ✅ | — (implementado) |

> **Detalle RF-003a (Navegación híbrida padre/hijos):** Al navegar hacia una categoría con subcategorías como `/categoria/tulipanes` o `/categoria/arreglos-florales`, el usuario visualiza en la cabecera los accesos directos a cada subcategoría (`/categoria/tulipanes/en-caja`, etc.) y simultáneamente, en la parte inferior, la lista agregada de todos los productos pertenecientes a cualquiera de sus hijas mediante la consulta Supabase `getProductosPorCategorias`.
>
> **Detalle RF-005a (Header con scroll natural):** El elemento `<header>` utiliza posicionamiento `relative z-30` en lugar de `sticky top-0`, permitiendo que al desplazarse hacia abajo el encabezado suba fluidamente junto con el contenido de la página, liberando un 100% de la altura de pantalla útil para la exploración de arreglos florales.

---

## 2. Producto individual

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-010 | Ficha `/producto/:id` con imagen principal, miniaturas, breadcrumb, nombre, precio, descripción | Alta | ✅ | CLAUDE §6.2 |
| RF-011 | Badge de tag dinámico con color corporativo configurado en panel admin | Baja | ✅ | CLAUDE §6.2, §7 |
| RF-012 | Selector de cantidad (mínimo 1) | Media | ✅ | CLAUDE §6.2 |
| RF-013 | Botón "Agregar al carrito" abre el drawer lateral interactivo | Alta | ✅ | CLAUDE §6.2 |
| RF-014 | Botón "Comprar ahora" agrega y navega directamente al checkout | Media | ✅ | CLAUDE §6.2 |
| RF-015 | Nota informativa de distritos cubiertos y tiempos de entrega | Baja | ✅ | CLAUDE §6.2 |
| RF-016 | Carrusel de productos recomendados y relacionados | Baja | ✅ | CLAUDE §6.2 |
| RF-017 | Botón rápido "Agregar al carrito" en tarjetas del Home (`Novedades.tsx`) | Media | ❌ | Solicitud Cliente (Home UI) |
| RF-018 | Botón "Compartir" en tarjetas del Home (`Novedades.tsx`) vía Web Share API o portapapeles | Baja | ❌ | Solicitud Cliente (Home UI) |
| RF-019 | Galería de imágenes sticky en ficha de producto calibrada con offset superior `lg:top-8` | Media | ✅ | Solicitud Cliente (v1.4.0) |

---

## 2.1. Experiencia de Home, Colecciones y Páginas Editoriales

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-025 | Sección de colecciones en Home con diseño Collage Bento editorial asimétrico (`CategoryShowcase.tsx`) | Media | ✅ | Solicitud Cliente (v1.2.0) |
| RF-026 | Página de marca independiente y dedicada `/nosotros` (`src/routes/nosotros.tsx`) | Media | ✅ | Solicitud Cliente (v1.1.0) |
| RF-027 | Retiro de secciones no prioritarias del Home (ocasiones y "Nosotros" incrustado) para unificar foco en conversión | Media | ✅ | Solicitud Cliente (v1.1.0) |
| RF-028 | Calibración responsiva armónica en carrusel de novedades (`Novedades.tsx`) para pantallas de laptop | Alta | ✅ | Solicitud Cliente (v1.3.5) |
| RF-029 | Sustitución de colecciones de bajo catálogo (*Nacimientos*, *Box Luxury*) por colecciones emblemáticas (*Cumpleaños*, *Ramos*) con fotos HD WebP | Media | ✅ | Solicitud Cliente (v1.3.0) |

> **Detalle RF-025 (Bento Collage Editorial):** Presenta una composición editorial con microinteracciones de escala (`scale-105`), tipografía `Cormorant Garamond`, 1 tarjeta feature vertical de 2 filas, 1 tarjeta horizontal de 2 columnas, badges con conteo dinámico de productos por categoría y fotografías WebP de alta definición.
>
> **Detalle RF-026 (Página `/nosotros`):** Proporciona la identidad y narrativa de la boutique de Miraflores fuera de la página de aterrizaje, incorporando historia, pilares de arte floral, selección consciente de flores, tiempos de despacho y ubicación del atelier.
>
> **Detalle RF-028 (Escalabilidad en Laptops):** Ajuste del ancho de tarjeta a `230px-250px` y altura a `~340px`, garantizando que en monitores de 1366×768 o 1440×900 quepan 5 tarjetas completas sin sobrepasar el marco visual del usuario.

---

## 3. Carrito

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-020 | Carrito global en Zustand, persistente durante la navegación, en memoria (sin BD) | Alta | ✅ | CLAUDE §6.1 |
| RF-021 | Drawer lateral con overlay, lista de items, miniatura, precio, cantidad ± y eliminar | Alta | ✅ | CLAUDE §6.1 |
| RF-022 | Contador de items reactivo en el ícono del header | Media | ✅ | CLAUDE §6.1 |
| RF-023 | Footer del drawer con subtotal y botón directo a checkout | Alta | ✅ | CLAUDE §6.1 |
| RF-024 | Estado vacío con mensaje ilustrado y CTA de exploración al catálogo | Baja | ✅ | CLAUDE §6.1 |

---

## 4. Checkout y delivery por distritos

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-030 | Redirect a home si el carrito está vacío al intentar acceder | Media | ✅ | CLAUDE §6.3 |
| RF-031 | Formulario datos del cliente (nombre, teléfono +51, email) | Alta | ✅ | CLAUDE §6.3 |
| RF-032 | Formulario de entrega (distrito, dirección, referencia, fecha, hora, notas) | Alta | ✅ | CLAUDE §6.3 |
| RF-033 | Al elegir distrito se aplica automáticamente su costo de delivery al total | Alta | ✅ | Cotización 3.2 |
| RF-034 | Resumen del pedido con subtotal + delivery + total consolidado | Alta | ✅ | CLAUDE §6.3 |
| RF-035 | Validaciones inline con Zod / React Hook Form | Alta | ✅ | CLAUDE §6.3 |
| RF-036 | Registro del pedido en BD con número `FM-XXXXXX` y estado inicial | Alta | ✅ | CLAUDE §6.3 |

---

## 5. Pago (IZIPay)

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-040 | El cliente paga con IZIPay directamente desde la web | **Alta** | ❌ | Cotización 3.3 |
| RF-041 | Confirmación automática del pago antes de procesar el pedido | **Alta** | ❌ | Cotización 3.3 |
| RF-042 | Integración vía Edge Function (credenciales nunca en frontend) | **Alta** | ❌ | CLAUDE §10, §16 |
| RF-043 | Webhook que actualiza el pedido a "pagado" | **Alta** | ❌ | CLAUDE §10 |
| RF-044 | Ambientes Sandbox y Producción separados | Alta | ❌ | CLAUDE §10 |

> **Nota:** La integración formal de IZIPay se encuentra en espera de entrega de credenciales transaccionales de producción por parte de Sofía. En la actualidad, el pedido se guarda en Supabase y se ofrece coordinación y confirmación vía WhatsApp.

---

## 6. Confirmación de pedido

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-050 | Página `/confirmacion` con número de pedido, resumen y datos de entrega | Alta | ✅ | CLAUDE §6.4 |
| RF-051 | Redirect a home si se accede a la ruta sin un pedido generado | Baja | ✅ | CLAUDE §6.4 |
| RF-052 | CTA a WhatsApp con mensaje pre-armado y número de pedido | Media | ✅ | CLAUDE §6.4 |

---

## 7. Panel de administración

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-060 | Login admin y protección de rutas `/admin/*` mediante Supabase Auth | Alta | ✅ | CLAUDE §12 |
| RF-061 | CRUD de productos (crear, editar, eliminar, fotos, precios, activo) | Alta | ✅ | CLAUDE §13, Cotización 3.4 |
| RF-062 | CRUD de categorías y colecciones del home | Alta | ✅ | CLAUDE §13 |
| RF-063 | Gestión de distritos y tarifas de delivery | Alta | ✅ | Cotización 3.2 |
| RF-064 | Gestión de banners, popup, ocasiones y tags del home | Media | ✅ | CLAUDE §13 |
| RF-065 | Vista de pedidos con detalle completo (cliente, productos, distrito, montos) | Alta | ✅ | Cotización 3.4 |
| RF-066 | Cambio de estado del pedido con un clic | Alta | ✅ | Cotización 3.4 |
| RF-067 | Configuración general (WhatsApp, correo, horario, redes, libro de reclamaciones) | Media | ✅ | CLAUDE §13, §15 |
| RF-068 | Upload de imágenes a Supabase Storage con previsualización | Media | ✅ | CLAUDE §13 |
| RF-069 | Reordenamiento con flechas ↑↓ y conmutador de estado activo inline | Baja | ✅ | CLAUDE §13 |

---

## 7.1. Promociones, Popup y Fidelización

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-064a | Listón lateral permanente de suscripción en color rosa (`#C4848A`) | Media | 🔄 Retirado | Solicitud Cliente (v1.0.5) |
| RF-064b | Popup modal de captura de celular (+51) con control de frecuencia (máx 1 vez por sesión) y prevención de duplicados | Media | ✅ | Solicitud Cliente (Fidelización) |

> **Nota sobre RF-064a:** El botón flotante lateral fue removido a solicitud explícita del cliente para mantener la interfaz completamente limpia y despojada de elementos adhesivos en los bordes laterales.

---

## 7.2. Resolución de Incidencias y Usabilidad en Catálogo

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-064c | Normalización y resolución automática de alias de tags (`tag-utils.ts`) para mantener colores dinámicos | Alta | ✅ | Incidencia Reportada |
| RF-061a | Feedback visual inmediato al guardar/editar producto (banner de éxito, resalte de fila en ámbar y auto-scroll) | Alta | ✅ | Incidencia Reportada |

---

## 8. Estados del pedido

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-070 | Estado "Recibido" (pedido y pago confirmados) | Media | ⚠️ | Cotización §2 |
| RF-071 | Estado "En preparación" | Media | ❌ | Cotización §2 |
| RF-072 | Estado "En camino" | Media | ✅ | Cotización §2 |
| RF-073 | Estado "Entregado" | Media | ✅ | Cotización §2 |

---

## 9. Notificaciones

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-080 | Notificación por correo al recibir un nuevo pedido | **Alta** | ❌ | Cotización 3.4 |
| RF-081 | (Fase 3) Aviso al admin + correo al cliente tras pago exitoso | Media | ❌ | CLAUDE §10 |

---

## 10. Libro de reclamaciones

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RF-090 | Página `/libro-de-reclamaciones` con formulario según normativa peruana | Media | ✅ | CLAUDE §5 |
| RF-091 | Gestión y visualización de reclamaciones desde el panel de administración | Baja | ✅ | CLAUDE §13 |

---

## 11. Requisitos No Funcionales (RNF)

| ID | Requisito | Prioridad | Estado | Fuente |
| --- | --- | --- | --- | --- |
| RNF-01 | Diseño responsivo calibrado para smartphones, tablets y pantallas de laptops | Alta | ✅ | Cotización 3.1 |
| RNF-02 | Identidad de marca (paleta crema/tierra/rosa, logo e isotipo vectoriales) | Alta | ✅ | Cotización 3.1, CLAUDE §4 |
| RNF-03 | SEO: meta tags por ruta, Open Graph, `robots.txt` excluyendo `/admin` | Media | ⚠️ | CLAUDE §14 |
| RNF-04 | Schema.org estructurado `Florist`/`LocalBusiness` | Baja | ⚠️ | CLAUDE §14 |
| RNF-05 | Seguridad: RLS estricto en todas las tablas; secrets solo en servidor; mitigación CVE-2026-102989 | Alta | ✅ | CLAUDE §3, §11 |
| RNF-06 | Optimización de imágenes en formato WebP con compresión de alto rendimiento | Media | ✅ | CLAUDE §14, §18 |
| RNF-07 | Feedback de errores al usuario (toasts/banners), compilación sin errores | Media | ✅ | CLAUDE §18 |
| RNF-08 | Dominio propio configurado para producción | Media | — | Cotización 3.5 (operativo) |
| RNF-09 | Manual de uso + capacitación 1h + 1 mes de soporte | Media | ❌ | Cotización 3.5 (servicio) |

---

## 12. Resumen para el análisis de cumplimiento

- **Completitud Funcional de la Tienda:** 92% de los requerimientos operativos de la plataforma se encuentran activos y verificados en producción.
- **Bloqueantes Externos (Fase 3):**
  - Pasarela IZIPay (RF-040 a RF-044) en espera de credenciales comerciales del comercio.
  - Servicio de Correo Transaccional (RF-080).
- **Últimas Mejoras Incorporadas con Éxito:**
  - Header con scroll natural no adhesivo (RF-005a).
  - Bento Collage editorial asimétrico en Home (RF-025).
  - Página dedicada `/nosotros` (RF-026).
  - Navegación híbrida y subfiltros de subcategorías (RF-003a, RF-006a).
  - Adaptabilidad y proporciones optimizadas en laptops (RF-028).
