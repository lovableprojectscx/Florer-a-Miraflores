---
name: qa-seo-geo
description: Estrategia y validación de SEO Técnico y GEO-Targeting local para Lima, Perú (Schema.org Florist/Product, metadatos enriquecidos, Open Graph para WhatsApp y cobertura distrital).
---

# Skill: SEO Técnico y GEO Local (Lima, Perú)

## Propósito
Posicionar orgánicamente a Florería Miraflores en búsquedas locales de alta intención de compra (*"floreria en miraflores delivery hoy"*, *"rosas rojas san isidro"*, etc.) y generar tarjetas sociales ricas al compartir en WhatsApp.

## Checklist de Implementación
1. **Datos Estructurados Schema.org (JSON-LD con `safeJsonLd`)**:
   - `Florist` en `/` (Home): Coordenadas de Miraflores, teléfono, horario de 08:00 a 20:00, cobertura distrital.
   - `Product` + `BreadcrumbList` en `/producto/:id`: Precio, moneda `PEN`, disponibilidad `InStock`, descripción sin markdown.
   - `BreadcrumbList` en categorías (`/categoria/:slug`) y subcategorías (`/categoria/:slug/:sub`).
2. **Canónicas Dinámicas y GEO Agéntico (`llms.txt`)**:
   - `<link rel="canonical">` auto-referenciada dinámicamente por ruta en `__root.tsx` (`noindex, nofollow` en `/admin`, `/checkout`, `/confirmacion`).
   - Meta tags `geo.region: PE-LIM`, `geo.placename: Miraflores, Lima` y `<html lang="es-PE">`.
   - Archivo `/public/llms.txt` activo para descubrimiento por ChatGPT, Gemini, Perplexity y puntuación 2/2 en Navegación Agéntica de Lighthouse.
3. **Open Graph & WhatsApp Preview**:
   - `/public/Logo.webp` disponible (200 OK) como imagen de respaldo oficial.
   - `og:title` y `og:description` limpios sin sintaxis de markdown.
