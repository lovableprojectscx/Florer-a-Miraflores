---
name: qa-pagespeed-vitals
description: Auditoría y optimización de rendimiento móvil y Core Web Vitals (LCP < 2.5s, CLS < 0.05, INP < 200ms, compresión WebP, headers Edge cache) para Florería Miraflores.
---

# Skill: Optimización de Rendimiento y Core Web Vitals

## Propósito
Asegurar que la tienda cargue ultra rápido en dispositivos móviles 4G (donde se realiza el 85%+ de las compras de flores vía WhatsApp/Instagram).

## Metas Core Web Vitals Móvil
- **LCP (Largest Contentful Paint):** < 2.5 segundos (precarga con `fetchpriority="high"` en la imagen principal).
- **CLS (Cumulative Layout Shift):** < 0.05 (ratios reservados en todos los contenedores de fotos).
- **INP (Interaction to Next Paint):** < 200 milisegundos (drawers y filtros inmediatos).
- **Peso Total de Página Móvil:** < 1.5 MB total (miniaturas WebP optimizadas).

## Protocolo de Auditoría
1. **Auditoría Lighthouse CLI**:
   ```bash
   npx lighthouse https://florer-a-miraflores.vercel.app/ --preset=mobile --output=json,html
   ```
2. **Inspección de Assets Críticos, Storage S3 y File Egress (`RNF-15`)**:
   - Comprobar paridad estricta 1:1:1 entre original (`<= 1600px` en productos), `thumbs/960` (~49 KB) y `thumbs/480` (~17 KB) en los buckets `productos`, `categorias`, `banners`, `testimonios` y `popup` (`node scripts/saneamiento-storage-egress.mjs`).
   - Verificar cabeceras reales de S3 (`Cache-Control: public, max-age=31536000`) mediante `GET` y Playwright (`tests/e2e/qa-storage-egress-seo.spec.ts`), asegurando `0` errores HTTP `4xx` en `/thumbs/`, `0` archivos huérfanos y transferencia de catálogo `< 1.2 MB` por lote de 24 tarjetas.
   - Code-splitting verificado: módulos de `/admin` no deben descargarse en el storefront público.
