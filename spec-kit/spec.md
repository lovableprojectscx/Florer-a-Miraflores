# Spec — Florería Miraflores (qué es y qué hace)

## Resumen

Tienda online de diseño floral y regalos premium en Lima Metropolitana con catálogo dinámico (**974 productos activos**), navegación jerárquica de categorías y subcategorías, carrito reactivo en memoria, checkout con cálculo automático de delivery por distrito y blindaje anti-tampering en servidor, mural de recuerdos de entregas reales, reseñas verificadas y panel de administración integral.

## Usuarios

- **Cliente final:** navega el catálogo, filtra por categoría/precio/orden, lee descripciones estructuradas en Markdown, agrega al carrito, realiza checkout y coordina el pago por WhatsApp (integración automática IZIPay preparada para Fase 3).
- **Agentes de IA (ChatGPT, Gemini, Perplexity):** consumen `/llms.txt` y el marcado estructurado Schema.org (`Florist`, `Product`, `BreadcrumbList`) con GEO-targeting en Miraflores, Lima (`PE-LIM`).
- **Admin (Sofía / marketing):** gestiona todo desde `/admin/*` sin tocar código (incluyendo editor Markdown con vista previa, ocultación sin borrado mediante `activo` / `publicado`, subida automática con miniaturas WebP e higiene de Storage).

## Rutas públicas

- `/` Home (barra de anuncio, Hero 8:3 con precarga LCP SSR, franjas editoriales de tags, colecciones Bento, reseñas reales, mural de recuerdos, cobertura distrital y FAQ).
- `/catalogo` catálogo completo con filtros en tiempo real y paginación incremental "Ver más" (lotes de 24 tarjetas 1:1 usando miniaturas `thumbs/480`).
- `/categoria/:slug` y `/categoria/:slug/:sub` navegación híbrida padre/subcategorías con redirección automática de alias (`categorias-utils.ts`).
- `/tag/:key` colecciones temáticas por etiqueta (`novedad`, `oferta`, `mas_vendido`, `edicion_limitada`).
- `/producto/:id` ficha de producto 1:1 con galería sticky, descripción enriquecida en Markdown, migas de pan con Schema `BreadcrumbList`, agregar/comprar y relacionados.
- `/resenas` reseñas auténticas seleccionadas de Google con enlace verificable.
- `/recuerdos` y `/recuerdos/:slug` mural tipo polaroid de entregas reales en distritos de Lima (con redirección 301 desde `/blog`).
- `/nosotros` identidad e historia del atelier en Miraflores.
- `/terminos`, `/privacidad`, `/cambios-y-devoluciones` y `/libro-de-reclamaciones` marco normativo peruano (Indecopi / Ley N° 29733).
- `/checkout` y `/confirmacion` flujo transaccional con recálculo de precios en BD (`trg_pedidos_zz_integridad_precios`) y CTA pre-armado a WhatsApp (`FM-XXXXXX`).
- `/llms.txt`, `/sitemap.xml` y `/robots.txt` activos técnicos de indexación y navegación agéntica (`2/2`).

## Panel admin (`/admin/*`)

Login protegido por Supabase Auth + `public.is_admin()`. Módulos CRUD completos: `dashboard`, `productos` (editor Markdown + vista previa, orden en tienda, ocultar/activar sin eliminar, limpieza de huérfanos en Storage al borrar), `categorias`, `colecciones-home`, `ocasiones`, `banners` (desktop + móvil), `popup` (con miniaturas WebP), `distritos`, `pedidos` (6 estados operativos), `reclamaciones`, `testimonios`, `recuerdos`, `suscriptores`, `tags` y `config`.

## Alcance y trazabilidad de requisitos

La matriz completa de **Requisitos Funcionales (RF-001 a RF-124)** y **Requisitos No Funcionales (RNF-01 a RNF-18)** está certificada en [`../docs/REQUISITOS-FUNCIONALES.md`](../docs/REQUISITOS-FUNCIONALES.md). El diseño arquitectónico se detalla en [`../docs/ARQUITECTURA.md`](../docs/ARQUITECTURA.md) y el estado de QA en [`../docs/CERTIFICACION-LANZAMIENTO.md`](../docs/CERTIFICACION-LANZAMIENTO.md).
