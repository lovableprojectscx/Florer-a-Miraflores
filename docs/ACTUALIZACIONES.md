# Historial de Actualizaciones Técnicas — Florería Miraflores

Este documento registra de manera cronológica y exhaustiva todos los cambios arquitectónicos, nuevas funcionalidades, ajustes de interfaz, optimizaciones de rendimiento y resolución de incidencias realizados en la plataforma.

---

## Índice de Versiones e Hitos

|   Versión   |   Fecha    |          Tipo          | Resumen de Cambios                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| :---------: | :--------: | :--------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.12.2** | 2026-10-15 | **Home / UI / Storage** | Franja «Recuerdos de entrega» en Home debajo de reseñas con carrusel responsive (scroll-snap, flechas desktop, formato 4:5 con ResponsiveImage y miniaturas); regla de renderizado condicional (retorna null si 0 publicados); fechas de reseñas normalizadas a «mes año» (ej. «ago. 2026») sin días aproximados inventados; generación y subida de 28 miniaturas WebP (`thumbs/480` y `thumbs/960`) en bucket `testimonios` con nombres neutrales anónimos (`recuerdo-01.webp` ... `recuerdo-14.webp`); tests unitarios y suite E2E completa verificada al 100%. |
| **v1.12.1** | 2026-10-15 |  **Privacidad / QA**   | Revisión de Seguridad y Privacidad en Mural de Recuerdos: despublicación preventiva en base de datos (`publicado = false`); anonimización de nombres de fotos en Storage (`recuerdo-01.webp` a `recuerdo-14.webp`); obligatoriedad de confirmación explícita de autorización del cliente para publicar en panel admin; campos de texto, ocasión, distrito y producto opcionales sin textos de relleno; botón WhatsApp «Quiero un arreglo así» cuando no hay producto asociado; estado vacío respetuoso «Pronto compartiremos nuestras entregas» en `/recuerdos`; prevención de reescritura de evidencias en prettier ignorando `docs/evidencias`.                                                                                                                                  |
| **v1.12.0** | 2026-10-15 | **Pivote Estratégico** | Reemplazo Arquitectónico de Blog a «Mural de Recuerdos». Sustitución del modelo de blog botánico tradicional por un mural visual interactivo tipo collage/polaroid con fotos reales de entregas en Lima (`/recuerdos`), asociadas a ocasión, distrito y producto del catálogo para compra directa; sincronización de métricas reales de Google (★ 4,8 · 129 reseñas); actualización de requisitos (RF-110 a RF-115) y esquema de datos (`public.recuerdos` con FKs a `distritos` y `productos`); política estricta de CERO invención de textos o testimonios ficticios; redirecciones 301 de `/blog` a `/recuerdos`; panel de administración `/admin/recuerdos` y generación de sitemap dinámico (628 URLs).                                                                       |
| **v1.11.0** | 2026-10-14 | **Blog / SEO / Admin** | Fase 09: Blog administrable para posicionamiento orgánico en Google (SEO). Páginas públicas `/blog` (tarjetas 16:9, paginación en lotes de 12 con `useVerMas`) y `/blog/$slug` (Markdown seguro sin HTML crudo vía `react-markdown`, autor, fecha, tiempo de lectura, bloque "Te puede gustar" con hasta 4 productos de la categoría relacionada, JSON-LD estructurado `BlogPosting` y 404 limpio); módulo admin `/admin/blog` con CRUD, filtros por estado (Borrador/Publicado/Programado), buscador, editor Markdown con pestañas Escribir/Vista previa, inserción de imágenes optimizadas a bucket `blog`, diálogo propio de eliminación y resiliencia ante SQL 008 pendiente; enlace en Footer y sitemap.xml dinámico; tests unitarios (15 blog-utils + 4 queries), RLS y E2E. |
| **v1.10.0** | 2026-10-13 |  **Reseñas / Admin**   | Fase 07: Reseñas reales elegidas a mano de Google (opción D). Página `/resenas` con grilla de tarjetas, estrellas, texto expandible y resumen real («★ 4,9 · 120 reseñas»); carrusel horizontal en Home condicionado a `mostrar_resenas_home = true` y >= 3 activas; panel admin `/admin/testimonios` con CRUD completo, selector 1-5 estrellas, fotos WebP, aviso de autenticidad y resiliencia ante SQL 007 pendiente; enlace en Footer y sitemap.xml; tests unitarios, RLS y E2E.                                                                                                                                                                                                                                                                                               |
| **v1.9.0**  | 2026-10-13 | **Certificación / QA** | Fase 06: Certificación pre-lanzamiento (`VEREDICTO: GO con condiciones`). Implementación y verificación de RF-017 (agregar al carrito desde el home) y RF-018 (compartir producto con portapapeles/toast); test E2E de flujo completo de compra y auditoría de desbordamiento horizontal en 360/390/1440px; auditoría de 412 imágenes (0 rotas); sitemap.xml (437 URLs) y robots.txt; `<html lang="es">`; Lighthouse móvil (100 SEO, 100 Best Practices); checklist manual y acta de certificación.                                                                                                                                                                                                                                                                                |

---

## Detalle de Hitos y Actualizaciones

### [v1.12.0] — 2026-10-15: Mural de Recuerdos de Entrega y Sustitución de Blog

#### Contexto y Decisión Comercial (Jack)

Un blog tradicional con artículos extensos sobre botánica y cuidado floral ("Cómo regar tus flores", "Significado de los colores") no genera impacto en la decisión de compra de arreglos florales para regalo. Los clientes buscan **inspiración visual inmediata, confianza y prueba social tangible**: ver que la florería entrega ramos hermosos y genera sonrisas reales en personas de carne y hueso en Lima (Miraflores, San Isidro, Surco, etc.).

Se transforma el módulo de Blog en un **Mural de Recuerdos de Entrega** interactivo:

1. **Página pública `/recuerdos`:** Galería estilo collage/polaroid donde se lucen las fotografías reales de entregas tomadas en el momento, con filtros por ocasión (Cumpleaños, Aniversario, Amor, etc.) y por distrito de entrega.
2. **Página de detalle `/recuerdos/$slug`:** Foto principal en alta resolución WebP, historia o frase corta del momento especial y bloque de conversión directa («Arreglo de este recuerdo») con el producto exacto y botón para agregarlo al carrito o solicitarlo por WhatsApp prellenado.
3. **Redirección permanente (301):** Tráfico hacia `/blog` y `/blog/$slug` redirigido transparentemente hacia `/recuerdos` y `/recuerdos/$slug` para preservar el SEO.
4. **Panel administrativo `/admin/recuerdos`:** Módulo para que la administradora suba fotos de entregas, seleccione ocasión, distrito y producto vinculado, sin necesidad de redactar artículos largos.
5. **Autenticidad absoluta:** Política rigurosa de cero invención. Se sembraron 14 recuerdos verídicos con las fotos reales WebP del bucket `testimonios`, asociadas a productos y distritos existentes.
6. **Migración SQL 012 (`docs/sql/012-recuerdos.sql`):** Tabla `public.recuerdos` con claves foráneas, índices, trigger de `updated_at`, RLS (lectura pública de publicados, control total admin) y vista retrocompatible `public.blog_posts`.

---

## Detalle de Hitos y Actualizaciones

### [v1.11.0] — 2026-10-14: Blog Administrable y Artículos SEO (Fase 09)

#### Contexto y Objetivo

Proveer una plataforma editorial integrada para que Sofía o la encargada del taller puedan publicar guías de cuidado de flores, consejos para ocasiones especiales y explicaciones de significado floral sin tocar código, logrando posicionamiento orgánico en Google y enlazando cada artículo con colecciones de productos reales para impulsar las ventas.

#### Cambios Implementados

1. **Página pública de listado `/blog` (`src/routes/blog.tsx`):**
   - Encabezado editorial compacto con ruta y eyebrow jerárquico.
   - Grilla responsive con tarjetas en relación de aspecto 16:9, portada optimizada, fecha formateada, autor, cálculo automático de tiempo de lectura y extracto.
   - Paginación incremental en lotes de 12 reusando el hook `useVerMas`.
   - Estado vacío digno cuando no hay artículos publicados.
   - Metadatos `<title>` y Open Graph configurados.
2. **Página pública de detalle `/blog/$slug` (`src/routes/blog.$slug.tsx`):**
   - Lectura cómoda en contenedor central de ~760px.
   - Cabecera con título, fecha, autor y tiempo estimado de lectura en minutos.
   - Portada 16:9 y resumen en bloque destacado estilizado.
   - Renderizado Markdown seguro con `react-markdown` **sin** `rehype-raw`, protegiendo la plataforma contra inyecciones XSS (etiquetas `<script>` ignoradas como código/texto sin ejecutar).
   - Componentes tipográficos afinados a la identidad visual de la florería e imágenes de contenido con carga diferida (`loading="lazy"`).
   - Bloque "Te puede gustar" con hasta 4 productos activos de la categoría vinculada (`categoria_relacionada_id`) y botón de acceso a la colección completa.
   - Respuesta 404 limpia y amigable si el artículo no existe o no se encuentra publicado.
   - Marcado de datos estructurados JSON-LD `BlogPosting` con datos reales.
3. **Módulo de Administración `/admin/blog` (`src/routes/admin/blog.tsx`):**
   - Enlace en sidebar con icono `BookOpen` en `src/routes/admin.tsx`.
   - Listado con badges de estado: Borrador (gris), Publicado (verde) y Programado (ámbar).
   - Búsqueda en tiempo real por título y slug, y filtros rápidos por estado.
   - Acciones: ver artículo público, alternar publicación inmediata con un clic, editar y eliminar con modal propio de confirmación (sin `window.confirm`).
   - Editor avanzado con tabs **"Escribir"** y **"Vista previa"**:
     - Generación automática de slug amigable desde el título con opción de regeneración manual y verificación de unicidad.
     - Contador de caracteres para el resumen con aviso visual al exceder 160 caracteres.
     - Subida de imagen de portada optimizada con miniaturas WebP en bucket `blog` vía `subirImagenConMiniaturas`.
     - Barra de herramientas rápida para negritas, cursivas, encabezados H2/H3, listas, citas y enlaces.
     - Botón "Insertar imagen" para subir fotos al bucket `blog` e insertarlas directamente en el punto del cursor en Markdown.
     - Selector jerárquico "Padre › Hija" para asociar categorías de productos.
     - Programación horaria mediante campo `datetime-local`.
     - Campos SEO opcionales (`meta_title` y `meta_description`).
   - Resiliencia arquitectónica: captura de códigos de error `42P01` y `PGRST205` con toast y banner informativo _"Falta correr el SQL 008"_.
4. **Base de Datos y Almacenamiento (`docs/sql/008-blog.sql`):**
   - Tabla `public.blog_posts` con RLS estricto (`is_admin()` para escritura, SELECT público solo para `publicado = true AND fecha_publicacion <= now()`).
   - Trigger `set_blog_posts_updated_at` para actualización de marca de tiempo.
   - Bucket Storage `blog` con lectura pública y escrituras exclusivas para administradores.
5. **Navegación y Sitemap:**
   - Enlace "Blog" incorporado en el Footer (`src/components/Footer.tsx`) bajo "Sobre Nosotros", manteniendo intacto el menú principal del Header.
   - Actualización de `scripts/generate-sitemap.mjs` para incluir `/blog` y consultar dinámicamente artículos de blog publicados con su fecha `lastmod`.
6. **Pruebas Automatizadas:**
   - Unitarias Vitest: 15 tests en `tests/unit/blog-utils.test.ts` (slugify con tildes/ñ, reglas de visibilidad, cálculo de lectura, formateo de fechas, validación de formularios y schema JSON-LD) y 4 tests en `tests/unit/queries.test.ts`.
   - Seguridad RLS: test en `tests/rls/rls.test.ts` validando que `anon` no puede escribir en `blog_posts` ni leer borradores.
   - E2E Playwright: suite en `tests/e2e/blog.spec.ts` validando carga responsiva a 390px y 1440px sin desbordamiento horizontal, 404 limpio, bloqueo de ejecución de scripts HTML en Markdown y flujos del panel admin.

### [v1.10.0] — 2026-10-13: Reseñas Reales y Testimonios de Google (Fase 07)

#### Contexto y Objetivo

Implementar el sistema de opiniones de clientes basado en la **opción D** definida por Jack: reseñas reales seleccionadas y copiadas manualmente desde el perfil de Google Business a la base de datos a través del panel de administración, complementado con un botón directo para consultar todas las reseñas en Google. NADA de scraping no oficial ni widgets de terceros. Cumplimiento de directrices de Google impidiendo marcado JSON-LD artificial sobre reseñas elegidas por el propio negocio.

#### Cambios Implementados

1. **Página pública `/resenas` (`src/routes/resenas.tsx`):**
   - Encabezado editorial «Lo que dicen nuestros clientes».
   - Resumen dinámico y verídico extraído de `config`: «★ 4,9 · 120 reseñas en Google» (no se muestra si falta el rating o conteo).
   - Botón «Ver todas en Google» con enlace directo seguro (`target="_blank"`, `rel="noopener noreferrer"`).
   - Grilla responsive de tarjetas (`src/components/ResenaCard.tsx`): 5 estrellas, corte de texto a ~6 líneas con desplegable «Leer más / Leer menos», autor, fecha amigable, badge de procedencia (Google, WhatsApp, Facebook, Cliente verificado) y visor modal para foto del arreglo.
   - Estado vacío elegante cuando no hay testimonios registrados.
   - Metadatos SEO limpios sin marcado estructurado prohibido (`AggregateRating` / `Review`).
2. **Franja horizontal en Home (`src/components/HomeTestimonios.tsx`):**
   - Carrusel horizontal con snap scrolling ubicado inmediatamente debajo de Colecciones Home.
   - Regla estricta de visualización: únicamente se renderiza si `mostrar_resenas_home = true` Y existen al menos 3 reseñas activas.
   - Enlace directo «Ver todas las reseñas» hacia `/resenas`.
3. **Enlaces y Navegación:**
   - Enlace «Reseñas» incorporado en el pie de página (`src/components/Footer.tsx`) bajo la sección de Sobre Nosotros.
   - Menú de navegación principal del Header intacto según especificación.
   - Ruta `/resenas` agregada al generador de sitemap (`scripts/generate-sitemap.mjs`).
4. **Módulo de Administración `/admin/testimonios` (`src/routes/admin/testimonios.tsx`):**
   - Enlace con icono `Star` incorporado en el sidebar lateral de administración (`src/routes/admin.tsx`).
   - CRUD completo: creación, edición, toggle inmediato de estado activo/inactivo, toggle de destacado, reordenamiento ordinal (↑/↓) y eliminación con diálogo de confirmación.
   - Formulario modal con selector interactivo visual de 1 a 5 estrellas, carga optimizada de fotos a WebP en el bucket `testimonios` mediante `subirImagenConMiniaturas`.
   - Banner de advertencia fija de autenticidad: _«Copia la reseña tal cual aparece en Google. No la edites ni inventes reseñas.»_
   - Bloque integrado de configuración de Google: edición de URL del perfil, puntuación (rating), total de reseñas y toggle de visibilidad en el Home.
   - Resiliencia arquitectónica: si la tabla `public.testimonios` aún no ha sido migrada, la pantalla no se rompe y muestra un aviso informativo de migración pendiente.
5. **Base de Datos y Seguridad (`docs/sql/007-testimonios.sql`):**
   - DDL idempotente para tabla `public.testimonios` con RLS estricto (`is_admin()` para escritura, lectura pública filtrada por `activo = true OR is_admin()`).
   - Campos de Google agregados a `public.config`.
   - Bucket de almacenamiento `testimonios` con políticas seguras.
6. **Pruebas Automatizadas:**
   - Vitest: 16 pruebas unitarias (`tests/unit/resenas-utils.test.ts`) cubriendo validación del formulario (estrellas 1-5, texto >= 10 caracteres, nombre obligatorio), formateo decimal con coma («4,9») y regla de visibilidad en Home.
   - RLS: prueba de rechazo 42501 para inserciones anónimas en `tests/rls/rls.test.ts`.
   - Playwright: suite completa en `tests/e2e/resenas.spec.ts` validando carga responsiva a 390px y 1440px, ausencia de scroll horizontal, navegación y panel admin.
     | **v1.8.0** | 2026-10-13 | **Pedidos / Checkout** | Fase 05: Certificación de estado `"En preparación"`, selector reordenado según flujo operativo y toasts en `/admin/pedidos`; corrección de fecha mínima en Lima (`America/Lima`) en `getFechaMinima()`; reintento automático ante colisión de número de pedido (código 23505) en `crearPedido()`; documentación de riesgo de montos y trigger borrador en `docs/SEGURIDAD.md`; tests E2E y unitarios. |
     | **v1.7.0** | 2026-10-12 | **Catálogo / UI** | Fase 04: Paginación incremental `"Ver más"` en lotes de 24 (`use-ver-mas.ts`), fotos protagonistas `aspect-[4/5]`, grilla máximo 4 columnas (`grid-cols-2 md:grid-cols-3 xl:grid-cols-4`), `decoding="async"`, `sizes` y placeholder explícito en `ProductGrid`. |
     | **v1.6.1** | 2026-10-12 | **Seguridad / RLS** | Fase 03-B: Endurecimiento de políticas RLS con tabla `public.admins`, función `public.is_admin()`, script `docs/sql/005-admin-rls.sql`, auditoría de `pedidos`/`reclamaciones`/`storage` y tests E2E de las 12 secciones de `/admin`. |
     | **v1.6.0** | 2026-10-12 | **Categorías / Admin** | Fase 03: Ocultamiento automático de categorías vacías en la web pública, selector agrupado `Padre › Hija` en `/admin/productos`, toasts y conteos en `/admin/categorias`, redirección de subcategorías movidas y scripts SQL `003`/`004`. |
     | **v1.5.1** | 2026-10-12 | **Diagnóstico** | Fase 02: Diagnóstico de categorías en solo lectura (`scripts/diagnostico-categorias.mjs`, `docs/sql/diagnostico-categorias.sql`, `docs/DIAGNOSTICO-CATEGORIAS.md`). |
     | **v1.5.0** | 2026-10-12 | **QA / Testing** | Base de pruebas automatizadas: Vitest (unitario + RLS), Playwright E2E (mobile/desktop) y comando único `npm run verify`. |
     | **v1.4.2** | 2026-10-08 | **Admin / Jerarquía** | Soporte explícito y visualización de subcategorías agrupadas por padre en Colecciones Home. |
     | **v1.4.1** | 2026-10-08 | **UI / Navbar** | Retiro de botones "Catálogo", "Nosotros" y "Preguntas" del menú superior del Header para una vista limpia y enfocada en flores. |
     | **v1.4.0** | 2026-10-08 | **UX / Layout** | Header con scroll natural (des-anclaje de sticky) y calibración de galería de producto. |
     | **v1.3.5** | 2026-10-08 | **Responsive** | Escala y proporción armónica para laptops en slider de novedades y colecciones. |
     | **v1.3.0** | 2026-10-08 | **Catálogo / Home** | Reemplazo de colecciones de baja densidad por "Cumpleaños" y "Ramos", fotos HD y filtros de subcategorías. |
     | **v1.2.0** | 2026-10-07 | **Diseño Editorial** | Rediseño Collage Bento asimétrico para colecciones destacadas del Home. |
     | **v1.1.0** | 2026-10-07 | **Estructura Web** | Creación de página dedicada `/nosotros` y simplificación de la landing page (retiro de ocasiones y sobrecarga). |
     | **v1.0.5** | 2026-10-07 | **UX / Limpieza** | Retiro del listón lateral flotante de promociones para navegación limpia. |
     | **v1.0.4** | 2026-10-07 | **Seguridad / CI** | Parche de seguridad CVE-2026-102989 en `@tanstack/react-start` y normalización de pipeline en Vercel. |
     | **v1.0.3** | 2026-10-06 | **Admin / Datos** | Unificación de tags, alias automáticos y feedback visual con auto-scroll en edición de productos. |
     | **v1.0.2** | 2026-10-05 | **Branding** | Incorporación de favicon e isotipos multirresolución y proporción exacta del Hero Banner (8:3). |
     | **v1.0.1** | 2026-10-04 | **Contenido / DB** | Carga masiva y optimización de activos fotográficos WebP en Supabase Storage (80+ productos). |

---

## Detalle de Hitos y Actualizaciones

### [v1.9.0] — 2026-10-13: Certificación Pre-Lanzamiento y Auditoría Global (Fase 06)

#### Contexto y Objetivo

Realizar la certificación exhaustiva de pre-lanzamiento (_go / no-go_) de la plataforma Florería Miraflores mediante auditoría automatizada y manual de flujos de compra, seguridad, imágenes públicas, SEO, rendimiento móvil (Lighthouse) y checklist pre-lanzamiento.

#### Cambios Implementados

1. **Acciones Rápidas en Home (`src/components/Novedades.tsx`):**
   - Implementación y certificación de RF-017 (botón "Agregar al carrito" que incorpora el ítem y abre el drawer interactivo sin abandonar la vista).
   - Implementación y certificación de RF-018 (botón "Compartir" con soporte nativo de Web Share API y fallback a portapapeles con `toast.error` ante rechazos).
   - Test E2E dedicado: [`tests/e2e/home-acciones.spec.ts`](file:///tests/e2e/home-acciones.spec.ts).
2. **Recorrido Completo de Compra y Auditoría Responsiva:**
   - Creación de [`tests/e2e/recorrido-compra.spec.ts`](file:///tests/e2e/recorrido-compra.spec.ts) cubriendo navegación Home → Catálogo/Categoría → Ficha de Producto → Carrito → Checkout → Confirmación con interceptación segura de inserción en Supabase (sin filas de prueba en producción).
   - Auditoría multi-resolución: verificación de `scrollWidth <= clientWidth` (0 desbordamiento horizontal) en 360px, 390px y 1440px en todas las vistas públicas.
   - Auditoría de enlaces de WhatsApp FAB hacia `https://wa.me/51999600482`.
3. **SEO, Sitemap y Metadatos:**
   - Corrección de accesibilidad e indexación en [`src/routes/__root.tsx`](file:///src/routes/__root.tsx): `<html lang="es">`.
   - Creación de [`public/robots.txt`](file:///public/robots.txt) con apertura de rutas públicas y exclusión de `/admin` y `/confirmacion`.
   - Creación de [`scripts/generate-sitemap.mjs`](file:///scripts/generate-sitemap.mjs) y generación de [`public/sitemap.xml`](file:///public/sitemap.xml) con 437 URLs activas indexables.
4. **Verificación de Imágenes Públicas:**
   - Creación y ejecución de [`scripts/verificar-imagenes.mjs`](file:///scripts/verificar-imagenes.mjs) con concurrencia 5: 412 URLs únicas auditadas, 412 válidas (100%), 0 rotas ([`docs/evidencias/fase-06/imagenes.md`](file:///docs/evidencias/fase-06/imagenes.md)).
5. **Auditoría Lighthouse Móvil y Documentación de Lanzamiento:**
   - Auditoría sobre build local de producción compilado: 100 en SEO y 100 en Best Practices en Home, Catálogo y Producto.
   - Creación de [`docs/CHECKLIST-MANUAL-LANZAMIENTO.md`](file:///docs/CHECKLIST-MANUAL-LANZAMIENTO.md) y acta oficial [`docs/CERTIFICACION-LANZAMIENTO.md`](file:///docs/CERTIFICACION-LANZAMIENTO.md) con `VEREDICTO: GO con condiciones`.

---

### [v1.8.0] — 2026-10-13: Certificación de Estado "En preparación" y Blindaje del Checkout (Fase 05)

#### Contexto y Objetivo

Certificar el funcionamiento del estado `"En preparación"` en el panel de administración y en la base de datos de producción; subsanar el desfase horario en la selección de fecha mínima de entrega para compras nocturnas en Lima; proteger el checkout ante colisiones de clave única de número de pedido; y documentar el riesgo de montos en inserciones públicas con propuesta de mitigación futura.

#### Cambios Implementados

1. **Certificación y UX del panel de pedidos (`src/routes/admin/pedidos.tsx`):**
   - Reordenamiento de `ESTADOS` y del selector del modal para reflejar el flujo operativo: Recibido (`pendiente`) → En preparación (`en_preparacion`) → En camino (`en_camino`) → Entregado (`entregado`), manteniendo `pagado` y `cancelado` como auxiliares.
   - Integración de notificaciones `toast` (Sonner): `toast.success("Pedido FM-XXXXXX → En preparación")` al actualizar y `toast.error` si ocurre algún fallo.
2. **Corrección de zona horaria en fecha mínima (`src/lib/checkout-schema.ts`):**
   - `getFechaMinima()` calcula "mañana" explícitamente en la zona horaria `America/Lima` utilizando `Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" })`.
   - Evita que a partir de las 19:00 (UTC−5) la fecha mínima salte a pasado mañana.
   - Alineación idéntica entre el atributo `min` del input de fecha y la regla de validación Zod en `checkoutSchema`.
3. **Resiliencia ante colisión de número de pedido (`src/lib/queries.ts`):**
   - `crearPedido()` implementa un bucle de hasta 3 intentos de reintento exclusivo para colisiones de clave única (código PostgreSQL `23505`).
   - Cualquier otro error falla de inmediato.
   - Mensaje claro con opción de contacto vía WhatsApp (`+51 999 600 482`) en caso de persistir la colisión tras 3 intentos.
4. **Auditoría de base de datos y scripts SQL (`docs/sql/`):**
   - Verificado por Supabase MCP que la columna `pedidos.estado` no tenía restricción `CHECK` restrictiva en producción, admitiendo `'en_preparacion'` sin error.
   - `docs/sql/verificar-estado-pedidos.sql`: script de solo lectura para auditar constraints y políticas RLS en `pedidos`.
   - `docs/sql/006-estado-en-preparacion.sql`: script DDL idempotente preparado por si a futuro se formaliza la restricción `CHECK`.
5. **Documentación de seguridad (`docs/SEGURIDAD.md`):**
   - Sección 6 agregada detallando el riesgo de manipulación de montos en cliente, la mitigación operativa actual (revisión humana vía WhatsApp) y la propuesta técnica futura (Edge Function o trigger en PostgreSQL, con borrador SQL comentado).
6. **Batería de pruebas automatizadas:**
   - Tests unitarios en `tests/unit/checkout-schema.test.ts` (10:00, 18:59, 19:00, 23:59 y fin de año en Lima) y `tests/unit/queries.test.ts` (reintentos por colisión y no-reintento ante otros errores).
   - Tests E2E en `tests/e2e/checkout.spec.ts` (reloj fijado a las 20:00 de Lima) y `tests/e2e/admin-pedidos.spec.ts` (filtro, modal y selector de 6 estados en solo lectura, con salvaguarda de 0 escrituras en producción).

---

### [v1.7.0] — 2026-10-12: Fotos de Catálogo Más Grandes (4:5) y Paginación "Ver más" por Lotes de 24 (Fase 04)

#### Contexto y Objetivo

Reducir el número de elementos montados en el DOM en móvil y el consumo de egress de Supabase Storage sin romper los filtros ni el ordenamiento en cliente, y dar mayor protagonismo visual a las fotografías del catálogo (inspirado en la proporción foto/tarjeta de Lima Floral: 2 columnas en móvil, 3 en `md`, máximo 4 en `xl`, fotos `aspect-[4/5]`).

#### Cambios Implementados

1. **Hook de paginación incremental (`src/hooks/use-ver-mas.ts`):**
   - `useVerMas<T>(items, tamanoLote = 24)` expone `{ visibles, total, mostrando, hayMas, verMas }`.
   - Se reinicia automáticamente a `24` cuando cambia la lista filtrada u ordenada mediante comparación por clave estable (`tamanoLote|longitud|ids`), sin resetear si se recibe un nuevo array con los mismos elementos.
2. **Grilla de productos (`src/components/ProductGrid.tsx`) y rutas de catálogo (`catalogo.tsx`, `categoria.$slug.tsx`, `categoria.$slug.$sub.tsx`, `tag.$key.tsx`):**
   - Prop opcional `tamanoLote?: number` aplicada con `tamanoLote={24}` en `/catalogo`, `/categoria/:slug`, `/categoria/:slug/:sub` y `/tag/:key` (los productos relacionados en `/producto/:id` no pasan `tamanoLote` y no paginan).
   - Contador `"Mostrando X de Y"` con `aria-live="polite"` y botón secundario `"Ver más"` que traslada el foco (`focus({ preventScroll: true })`) a la primera tarjeta del nuevo lote.
   - Cuadrícula ajustada a `grid-cols-2 md:grid-cols-3 xl:grid-cols-4`, contenedor de imagen en proporción `aspect-[4/5]`, bloque de texto compacto con `line-clamp-2 sm:line-clamp-1`, `decoding="async"`, `sizes` responsivos y placeholder explícito (`romantico`) cuando `imagenes` está vacío o `null`.
   - El "modo home" (productos estáticos) del componente permanece intacto.
3. **Pruebas y Evidencia Visual:**
   - Tests unitarios en `tests/unit/use-ver-mas.test.ts` (6 tests) y `tests/unit/ProductGrid.test.tsx` (3 tests).
   - Tests E2E en `tests/e2e/catalogo-paginacion.spec.ts` y capturas antes/después a 390 px y 1440 px en `docs/evidencias/fase-04/`.

---

### [v1.6.1] — 2026-10-12: Endurecimiento de Seguridad RLS (Fase 03-B)

#### Contexto y Objetivo

Todas las policies de escritura en las 10 tablas de catálogo/contenido, `SELECT`/`UPDATE`/`DELETE` en `pedidos` y `reclamaciones`, y `INSERT`/`DELETE` en `storage.objects` usaban `auth.uid() IS NOT NULL` (o `TO authenticated USING (true)`), permitiendo que cualquier usuario autenticado modificara el catálogo o leyera/modificara pedidos y reclamos.

#### Cambios Implementados

1. **Migración SQL idempotente (`docs/sql/005-admin-rls.sql`):**
   - Creación de `public.admins` (`user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`, `email text NOT NULL`, `created_at timestamptz`) con RLS activo y sin policies públicas.
   - Creación de `public.is_admin()` (`RETURNS boolean`, `LANGUAGE sql`, `STABLE`, `SECURITY DEFINER`, `SET search_path = public`).
   - Reemplazo de las policies de escritura en `banners`, `categorias`, `colecciones_home`, `config`, `distritos`, `faqs`, `ocasiones_home`, `popup`, `productos` y `tags` para exigir `public.is_admin()` tanto en `USING` como en `WITH CHECK`.
   - Reemplazo de `admin_select`, `admin_update` y `admin_delete` en `pedidos`, y `"Allow admin select/update to reclamaciones"` en `reclamaciones` para exigir `public.is_admin()`, manteniendo intacto el `INSERT` público.
   - Reemplazo de las policies de `INSERT` y `DELETE` (y adición de `UPDATE`) en `storage.objects` para los buckets `banners`, `categorias`, `productos` y `popup` usando `public.is_admin()`.
   - Bloque completo de reversa comentada para restaurar las policies previas si fuera necesario.
2. **Pruebas de RLS y E2E (`tests/rls/rls.test.ts`, `tests/e2e/admin.spec.ts`):**
   - Verificación en `tests/rls/rls.test.ts` de que `anon` no puede leer, actualizar ni eliminar filas en `pedidos` ni en `reclamaciones`.
   - Verificación en `tests/e2e/admin.spec.ts` de inicio de sesión con `.env.e2e.local` y recorrido en solo lectura de las 12 secciones del panel `/admin` validando encabezados y cero errores de consola/página.
3. **Documentación (`docs/SEGURIDAD.md`):**
   - Documentación detallada de la arquitectura de autorización (`public.admins` + `public.is_admin()`), matriz de policies antes y después en `public` y `storage.objects`, y procedimiento de alta/baja de administradores.

---

### [v1.6.0] — 2026-10-12: Arreglo de Categorías, Visibilidad Automática y Mejoras de Admin (Fase 03)

#### Contexto y Decisiones de Negocio

- **D1 = B:** `"Nacimientos"` pasa a ser categoría padre en el menú principal con las subcategorías `"Niño"` (`nacimientos-nino`) y `"Niña"` (`nacimientos-nina`).
- **D2 = A:** Cada producto pertenece a una única categoría (`categoria_id`), sin agregar `categorias_extra`.
- **Regla de visibilidad pública:** Cualquier categoría o subcategoría con 0 productos activos (directos + hijas) se oculta automáticamente en la tienda pública, mientras sigue visible y administrable en `/admin`.

#### Cambios Implementados

1. **Utilidades puras de categorías (`src/lib/categorias-utils.ts`):**
   - `filtrarCategoriasVisibles`, `calcularConteoProductosPorCategoria`, `armarOpcionesCategoriaSelect`, `buscarConflictoSlugCategoria`, `formatearErrorGuardadoCategoria` y `resolverRedireccionSubcategoria`.
2. **Panel Admin (`src/routes/admin/productos.tsx`, `src/routes/admin/categorias.tsx`, `src/routes/__root.tsx`):**
   - Montaje de `<Toaster />` (`sonner`) en `__root.tsx`.
   - En `/admin/productos`: `<select>` de categoría agrupado con `<optgroup>` y etiquetas `"Padre › Hija"` (marcando inactivas con `"(inactiva)"`) tanto en el formulario modal como en el filtro del listado.
   - En `/admin/categorias`: reemplazo de los 3 `alert()` por `toast` (`sonner`), validación previa y mapeo de error `23505` indicando en qué `<Padre> › <Nombre>` existe el slug duplicado (y si está inactiva), y columna de conteo de productos activos (`directos + hijas`) con badge `"No se ve en la web: 0 productos"`.
3. **Ocultamiento de categorías vacías y redirección en web pública (`src/lib/queries.ts`, `src/routes/catalogo.tsx`, `src/routes/categoria.$slug.tsx`, `src/routes/categoria.$slug.$sub.tsx`):**
   - `getCategorias()` y `getColecciones()` filtran automáticamente categorías sin productos activos.
   - En `/categoria/:slug` se ocultan tarjetas de subcategorías vacías y se preserva el estado `"— próximamente"` al entrar directo por URL a una categoría vacía.
   - En `/categoria/:slug/:sub` se ocultan hermanas vacías y se redirige automáticamente si la subcategoría pasó a ser categoría padre (`/categoria/ocasion/nacimientos` -> `/categoria/nacimientos`) o cambió de padre.
4. **Scripts SQL y Guía de Panel:**
   - `docs/sql/003-nacimientos-padre.sql` (idempotente con rollback comentado y `SELECT` de verificación).
   - `docs/sql/004-tulipanes-reasignacion.sql` (completamente comentado con un `UPDATE` por cada uno de los 13 productos en `Tulipanes` padre).
   - `docs/GUIA-PANEL-CATEGORIAS.md` con instrucciones paso a paso para la encargada.

---

### [v1.5.1] — 2026-10-12: Diagnóstico de Categorías (Fase 02 — Solo Lectura)

#### Contexto y Objetivo

Diagnosticar con evidencia real la causa de los 3 reclamos sobre categorías (_"Nacimientos no se refleja / no deja subirla"_, _"Dividir Nacimientos en Niño y Niña"_, _"Tulipanes no se refleja en Ramos y Arreglos"_) sin modificar ningún dato de producción.

#### Entregables Implementados

1. **Script de diagnóstico con `anon key` (`scripts/diagnostico-categorias.mjs`):** Consulta en solo lectura (`SELECT`) el árbol de las 29 categorías activas y los 402 productos activos, identificando subcategorías con 0 productos (`Tulipanes › Arreglos` tiene `0` productos mientras que `Tulipanes` padre tiene `13`), la existencia de `Ocasión › Nacimientos` (`39` productos activos) y la colisión de nombres duplicados (`"Ramos"`) en el `<select>` plano de `/admin/productos`.
2. **Consultas SQL para el SQL Editor (`docs/sql/diagnostico-categorias.sql`):** Archivo de solo `SELECT` para inspeccionar filas inactivas, conteos totales, productos sin categoría, `pg_policies` y constraints de `categorias`.
3. **Informe técnico y matriz de decisiones (`docs/DIAGNOSTICO-CATEGORIAS.md`):** Documenta causas confirmadas, clasificación y opciones D1 (`Niño/Niña`) y D2 (`Tulipanes en Ramos/Arreglos`).

---

### [v1.5.0] — 2026-10-12: Base de Pruebas Automatizadas (Vitest + Playwright + RLS + Verify)

#### Contexto y Objetivo

Establecer los cimientos de calidad y verificación continua antes de las siguientes fases funcionales, sin modificar el comportamiento visible para el cliente ni alterar datos de la base de datos de producción.

#### Solución Técnica Implementada

1. **Pruebas Unitarias (`vitest.config.ts` + `tests/unit/`):**
   - Configuración independiente en `jsdom` con `@vitejs/plugin-react`, `vite-tsconfig-paths` y `@testing-library/jest-dom`.
   - Extracción de `checkoutSchema` y `getFechaMinima` desde `src/routes/checkout.tsx` hacia `src/lib/checkout-schema.ts` sin cambiar su comportamiento.
   - Cobertura de `useCartStore` (`cart.test.ts`), `slugify` y `extractIdFromSlug` (`utils.test.ts`), utilidades de tags (`tag-utils.test.ts`), `useProductFilters` (`product-filters.test.ts`), validación de checkout (`checkout-schema.test.ts`, incluyendo `it.fails` documentado para el bug de zona horaria UTC en `getFechaMinima`) y `crearPedido` con cliente Supabase mockeado (`queries.test.ts`).
2. **Pruebas de Seguridad RLS (`vitest.rls.config.ts` + `tests/rls/rls.test.ts`):**
   - Verificación con `anon key` real de lectura pública en `productos`, `categorias`, `banners`, `distritos` y `config`, bloqueo de lectura en `pedidos` y bloqueo de escritura en `productos` y `categorias` exigiendo código `42501` en `INSERT` y usando un `id` real con predicados seguros en `UPDATE` y `DELETE`.
3. **Pruebas End-to-End (`playwright.config.ts` + `tests/e2e/`):**
   - Ejecución en proyectos `mobile` (`Pixel 7`) y `desktop` (`1440×900`) contra el servidor de desarrollo en puerto `8080`.
   - Fixture común (`tests/e2e/fixtures.ts`) que falla ante `console.error` o `pageerror` no permitidos, con `allowConsoleErrors` por URL para el test de ruta inexistente.
   - Suites: `smoke.spec.ts`, `catalogo.spec.ts`, `carrito.spec.ts`, `checkout.spec.ts` (con interceptación obligatoria de `POST **/rest/v1/pedidos*`) y `admin.spec.ts`.
4. **Pipeline de Verificación (`npm run verify` y `.github/workflows/verify.yml`):**
   - Limpieza de errores triviales de tipado (`error: unknown` en `errorComponent` de rutas) y lint (`no-explicit-any`, `prefer-const`, `no-empty-object-type`), dejando `lint`, `typecheck`, `test` y `build` en verde.

---

### [v1.4.2] — 2026-10-08: Organización Jerárquica de Categorías y Subcategorías en Colecciones Home

#### Solicitud del Cliente

> _"¿No permite subcategorías?"_ (Al abrir el selector de agregar colecciones en `/admin/colecciones-home`).

#### Contexto y Diagnóstico

Aunque la base de datos y el componente de la tienda ya soportaban el enlace hacia subcategorías, el selector desplegable en el panel de administración (`/admin/colecciones-home`) mostraba una lista alfabética plana sin distinguir entre categorías principales y subcategorías (ej. _Coronas Fúnebres_ o _Cruces_ aparecían sueltas sin indicar que pertenecen a _Defunción_, o _Ramos_ aparecía duplicado sin saber si correspondía a _Tulipanes_ o a _Arreglos Florales_). Tampoco la tabla indicaba el tipo de elemento configurado.

#### Solución Técnica Implementada

1. **Selector con `<optgroup>` y jerarquía visual (`src/routes/admin/colecciones-home.tsx`):**
   - Se agruparon las opciones en:
     - `── CATEGORÍAS PRINCIPALES ──`: Listado de categorías padre activas (_Arreglos Florales, Tulipanes, Defunción, Ocasión, etc._).
     - `── SUBCATEGORÍAS DE [PADRE] ──`: Grupos dedicados por categoría padre con prefijo indicativo (ej. `↳ Girasoles (de Primaverales)`, `↳ Coronas Fúnebres (de Defunción)`).
   - Actualización de etiquetas a *_"Categoría o Subcategoría *"*_ con texto explicativo que confirma la compatibilidad total.
2. **Badges de tipo en la tabla de colecciones:**
   - La columna ahora se titula **Colección / Tipo**.
   - Cada fila cuenta con un badge diferenciador: `Principal` o `Subcategoría de [Padre]`, tanto en versión de escritorio como en tarjetas móviles.
3. **Respeto riguroso del orden del administrador (`src/lib/queries.ts`):**
   - Se ajustó la consulta de `getColecciones()` para priorizar el orden manual (`col.orden`) establecido en la tabla por el administrador mediante las flechas ↑↓.

---

### [v1.4.1] — 2026-10-08: Retiro de Botones "Catálogo", "Nosotros" y "Preguntas" del Menú del Header

#### Solicitud del Cliente

> _"Quita de la vista de la landing el botón de nosotros, preguntas y catálogo."_

#### Contexto y Diagnóstico

En la barra de navegación del Header (`Header.tsx`), los enlaces directos a `Catálogo`, `Nosotros` y `Preguntas` ocupaban espacio horizontal al final de la lista de categorías florales. Al acumularse 12 elementos en una sola línea, la cabecera se percibía densa y comprimida en resoluciones de laptop y escritorio.

#### Solución Técnica Implementada

1. **Despeje de la barra de navegación de escritorio (`src/components/Header.tsx`):**
   - Se removieron los elementos `<li>` correspondientes a `/catalogo`, `/nosotros`, `/#faq` y el dropdown colapsable `Más`.
   - La barra ahora se dedica con exclusividad al descubrimiento de flores: **Inicio** + las 8 categorías padre oficiales (_Ocasión, Arreglos Florales, Arreglos Premium, Tulipanes, Primaverales, Defunción, Novedades, Ofertas_).
   - Se otorgó un espaciado más amplio y refinado (`gap-3 lg:gap-4 xl:gap-6 2xl:gap-8`) y tipografía con mayor legibilidad (`text-[11px] lg:text-[11.5px] xl:text-[12px] 2xl:text-[12.5px]`).
   - El botón **Inicio** ahora se muestra de forma consistente en todos los anchos de escritorio (`lg:block`).
2. **Sincronización del menú móvil:**
   - Se removieron igualmente los enlaces directos a "Catálogo Completo", "Sobre Nosotros" y "Preguntas frecuentes" del cajón deslizable móvil, manteniendo el menú enfocado en categorías y zonas de despacho.
3. **Persistencia institucional:**
   - La información institucional de la empresa ("Sobre nosotros"), las "Preguntas frecuentes" y el catálogo completo continúan estando plenamente disponibles y accesibles en el pie de página (`Footer.tsx`).

---

### [v1.4.0] — 2026-10-08: Header con Scroll Natural y Des-anclaje de Barra Fija

#### Solicitud del Cliente

> _"Otro también es del header que suba cuando se scrolea, que no se quede."_

#### Contexto y Diagnóstico

El encabezado `<header>` utilizaba las clases `sticky top-0 z-30`, lo cual mantenía una franja de entre 64px (móvil) y 96px (escritorio) fija en la parte superior de la pantalla durante todo el recorrido del usuario. En dispositivos de altura reducida o laptops, esta barra persistente consumía un porcentaje notable del área visible de compra.

#### Solución Técnica Implementada

1. **Flujo de desplazamiento relativo:**
   - En [`src/components/Header.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/components/Header.tsx), se removieron las clases `sticky top-0` y se asignó `relative z-30 shadow-[0_1px_3px_rgba(0,0,0,0.03)]`.
   - El header ahora se desplaza hacia arriba con el flujo natural del documento, desapareciendo de la vista cuando el usuario hace scroll hacia abajo.
2. **Reajuste en ficha de producto:**
   - En [`src/routes/producto.$id.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/routes/producto.$id.tsx), la columna sticky de la galería de fotos contaba con `lg:top-36` para evitar solaparse con el header fijo original.
   - Al no existir el header estático, se recalibró el anclaje a `lg:top-8`, maximizando la superficie visible de la fotografía y eliminando el espacio vacío artificial de 144px.
3. **Persistencia funcional:**
   - Los drawers móviles (menú lateral y carrito `CartDrawer`) mantienen sus propiedades `fixed inset-0` intactas, asegurando un despliegue impecable en cualquier posición de scroll.

---

### [v1.3.5] — 2026-10-08: Escala y Proporción Armónica para Pantallas de Laptops

#### Solicitud del Cliente

> _"Tal vez no se está adaptando bien porque en su pantalla sale muy grande."_

#### Contexto y Diagnóstico

En pantallas estándar de laptops (resoluciones comunes de 1366×768, 1440×900 y 1536×864 px), las tarjetas de producto en el carrusel de novedades (`Novedades.tsx`) tenían un ancho forzado de `w-[325px] sm:w-[345px]`. Esto provocaba una altura resultante de casi 480px, acaparando más del 65% del alto vertical visible de la laptop y permitiendo visualizar únicamente 2 a 3 tarjetas simultáneas de forma desproporcionada.

#### Solución Técnica Implementada

1. **Redimensión armónica de tarjetas (`src/components/Novedades.tsx`):**
   - Se ajustó el ancho base a `w-[215px] sm:w-[230px] lg:w-[245px] xl:w-[250px]`.
   - La altura total de cada tarjeta se redujo de ~470px a ~340px, permitiendo que en pantallas de laptop quepan cómodamente 5 productos completos a la vez.
   - Tipografía adaptada con títulos en `text-[13px] lg:text-[14px]` y badges calibrados para una apariencia limpia y refinada.
2. **Contenedores acotados:**
   - Se acotó el ancho máximo del contenedor principal a `max-w-[1400px]` con márgenes laterales elásticos (`px-4 sm:px-6 lg:px-12`) para evitar que el contenido toque los bordes del monitor.

---

### [v1.3.0] — 2026-10-08: Optimización de Colecciones y Filtros Jerárquicos en Catálogo

#### Solicitud del Cliente

> _"El nacimiento y luxury no hay creo en el catálogo... podemos cambiarlos por otros que tengan más fotos."_

#### Contexto y Diagnóstico

La sección de colecciones del Home mostraba categorías como _Nacimientos_ y _Box Luxury_, las cuales únicamente disponían de 2 productos en la base de datos de producción, restando valor a la experiencia de descubrimiento del usuario. Además, en el catálogo general, seleccionar una categoría padre no permitía desglosar sus subcategorías de manera inmediata.

#### Solución Técnica Implementada

1. **Reemplazo por colecciones de alta disponibilidad:**
   - En [`src/components/CategoryShowcase.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/components/CategoryShowcase.tsx), se reemplazaron las tarjetas por:
     - **Cumpleaños:** Categoría destacada con más de 40 productos en stock.
     - **Ramos:** Categoría insignia con 55 productos activos.
   - Vinculación con fotografías WebP en alta resolución servidas desde Supabase Storage.
2. **Consulta multi-categoría recursiva:**
   - En [`src/lib/queries.ts`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/lib/queries.ts), se creó la función `getProductosPorCategorias(categoriaIds: string[])` para realizar consultas mediante el operador `in` de Supabase, obteniendo en una única petición todos los productos de un grupo de categorías hijas.
3. **Navegación unificada en `/categoria/$slug`:**
   - En [`src/routes/categoria.$slug.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/routes/categoria.$slug.tsx), cuando una categoría padre tiene hijas (ej. _Tulipanes_ o _Arreglos Florales_), se muestran tanto los botones de acceso directo a cada subcategoría como el grid completo con todos los productos combinados debajo.
4. **Subfiltro interactivo en `/catalogo`:**
   - En [`src/routes/catalogo.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/routes/catalogo.tsx), al seleccionar una categoría padre, aparece una barra secundaria de subcategorías que permite filtrar de inmediato sin tener que abandonar la vista.

---

### [v1.2.0] — 2026-10-07: Bento Collage Editorial Asimétrico en Home

#### Solicitud del Cliente

> _"¿Podemos darle otro formato tipo collage a esto?"_

#### Solución Técnica Implementada

- En [`src/components/CategoryShowcase.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/components/CategoryShowcase.tsx), se sustituyó la cuadrícula estática uniforme por un layout Bento asimétrico:
  - **Tarjeta protagonista (Feature):** Abarca 2 filas verticales (`md:col-span-1 md:row-span-2`), ofreciendo gran impacto visual con fotografía vertical de alta calidad.
  - **Tarjeta ancha horizontal:** Ocupa 2 columnas (`md:col-span-2 md:row-span-1`) para destacar arreglos prémium.
  - **Tarjetas complementarias:** Cuadrículas armónicas con overlay suave y tipografía `Cormorant Garamond`.
  - Microinteracción de zoom sutil (`group-hover:scale-105 duration-700`) y pill flotante con la cantidad dinámica de arreglos disponibles por categoría.

---

### [v1.1.0] — 2026-10-07: Página Dedicada `/nosotros` y Depuración del Home

#### Solicitud del Cliente

> _"Flores para cada momento esa parte no va, y el de nosotros en la landing no va, podría ser en otra página."_

#### Solución Técnica Implementada

1. **Creación de ruta independiente `/nosotros`:**
   - Se creó [`src/routes/nosotros.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/routes/nosotros.tsx) como una experiencia editorial completa:
     - Historia de Florería Miraflores y su taller en el corazón del distrito.
     - Pilares: Arte Floral de Autor, Selección Consciente de Flores y Experiencia de Entrega en 60 minutos.
     - Galería visual del atelier y formulario/enlace directo de contacto.
2. **Depuración del Home (`src/routes/index.tsx`):**
   - Se removió el bloque de ocasiones (`Occasions.tsx`) y el bloque embebido de "Nosotros" (`About.tsx`).
   - El Home ahora prioriza estrictamente la conversión y descubrimiento de producto: **Hero Banner → Bento Collage de Colecciones → Novedades / Más Vendidos → Delivery y Testimonios → Footer**.
   - Los enlaces a "Nosotros" se redirigieron hacia la nueva ruta `/nosotros` en el menú del Header y en el pie de página.

---

### [v1.0.5] — 2026-10-07: Retiro del Listón Lateral Flotante de Promociones

#### Solicitud del Cliente

> _"No sé dónde hiciste el push porque el cintillo aún se mira... esa parte no va."_

#### Solución Técnica Implementada

- En [`src/components/PopupModal.tsx`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria%20miraflores/floreria-miraflo-main/src/components/PopupModal.tsx), se removió el botón/listón rosa lateral permanente que permanecía anclado a la derecha de la ventana (`fixed right-0 top-1/2`).
- El popup promocional se mantiene administrable y controlado mediante frecuencia de sesión (`sessionStorage`), pero sin generar ruido visual persistente en los costados de la pantalla.

---

### [v1.0.4] — 2026-10-07: Parche de Seguridad CVE-2026-102989 y Normalización Vercel

#### Diagnóstico

Durante los despliegues en Vercel, el build fallaba debido a una vulnerabilidad reportada en versiones anteriores del framework `@tanstack/react-start` (CVE-2026-102989), y conflictos entre archivos de bloqueo (`bun.lock` vs `package-lock.json`).

#### Solución Técnica Implementada

1. Se actualizó la dependencia `@tanstack/react-start` a la versión `1.168.60`.
2. Se eliminó el archivo `bun.lock` y se definió de forma explícita el comando de instalación en la configuración de Vercel mediante `npm ci` / `npm install`.
3. Se verificó la generación adecuada de artefactos SSR (`dist/server/server.js`) y cliente (`dist/client/`) con script post-build (`scripts/postbuild.js`).

---

### [v1.0.3] — 2026-10-06: Unificación de Tags y Feedback Visual en Edición de Productos

#### Diagnóstico

Al renombrar tags en el panel de control (ej. _Globos para enamorar_), los productos previamente asociados conservaban la clave histórica `flores_y_globos_para_sorprender`, renderizando insignias negras en la tienda. Además, al editar productos en el panel admin, la lista se reordenaba alfabéticamente desplazando el producto y provocando la falsa impresión de pérdida de datos.

#### Solución Técnica Implementada

1. Creación de [`src/lib/tag-utils.ts`](file:///c:/Users/JACK%20FRANKLIN/Desktop/Proyectos%20Idenza/Trabajos-Mayo/Floreria miraflores/floreria-miraflo-main/src/lib/tag-utils.ts) para resolución bidireccional de alias y migración transparente en segundo plano.
2. Adición de selector de ordenamiento en la tabla de productos del administrador (orden por más recientes `created_at DESC`).
3. Resalte visual animado en color ámbar (`ring-2 ring-amber-400`) y auto-scroll centrado en la fila del producto editado.

---

### [v1.0.2] — 2026-10-05: Branding Oficial y Proporción del Hero Banner

#### Solución Técnica Implementada

1. Creación y despliegue del paquete oficial de favicons e isotipos en formato `.ico` multirresolución (16x16, 32x32, 48x48), `.svg` vectorial, `.png` (180x180 para Apple Touch) y `site.webmanifest`.
2. Estandarización de las dimensiones del slider/banner principal del Home a la proporción oficial de diseño **8:3 (2560 × 960 px)**, tanto en los estilos frontend como en las recomendaciones del panel de administración.

---

### [v1.0.1] — 2026-10-04: Carga y Optimización de Activos Fotográficos WebP

#### Solución Técnica Implementada

1. Creación del bucket público `productos` en Supabase Storage con políticas RLS de acceso público y escritura autenticada.
2. Procesamiento, compresión y subida masiva de más de 80 fotografías reales de arreglos florales, ramos de novia, box románticos y tulipanes en formato moderno **WebP**, garantizando pesos inferiores a 120 KB por imagen y tiempos de carga instantáneos.
