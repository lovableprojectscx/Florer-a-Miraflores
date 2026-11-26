# Informe SDD — Calibración de Zoom en Productos, Popup Móvil y SEO Fase 1

**Fecha:** 25 de noviembre de 2026  
**Rama:** `seo-fase1`  
**Versión:** `v1.15.0`  

---

## 1. Auditoría de Zoom en Productos (Estado Actual por Superficie)

Se revisó el 100 % de las vistas donde se renderizan fotografías de productos en la tienda:

| Superficie | Archivo y Línea | Zoom en Reposo | Zoom en Hover | Veredicto |
|---|---|---:|---:|---|
| **Portada / Carruseles (`Novedades`)** | [`src/components/Novedades.tsx:18, 187`](../src/components/Novedades.tsx#L18) | **`1.1`** *(bajado desde `1.18`)* | **`1.155`** (`× 1.05`) | **Ajustado:** `1.18` (+18%) acercaba demasiado el borde superior en globos altos (estrella/jirafita) y orquídeas. Bajar a `1.1` (+10%) conserva presencia editorial con margen de seguridad. |
| **Catálogo y Categorías (`ProductGrid`)** | [`src/components/ProductGrid.tsx:121, 220`](../src/components/ProductGrid.tsx#L121) | `1.0` | `1.05` (solo `md:`) | **Óptimo:** encuadre completo 1:1 en reposo sin recortes; micro-zoom sutil solo en hover de escritorio. |
| **Ficha de Producto (`ProductDetailView`)** | [`src/components/ProductDetailView.tsx:133`](../src/components/ProductDetailView.tsx#L133) | `1.0` | `1.05` | **Óptimo:** muestra el arreglo completo 1:1 sin recortes en galería principal. |
| **Colecciones Bento (`CategoryShowcase`)** | [`src/components/CategoryShowcase.tsx:122`](../src/components/CategoryShowcase.tsx#L122) | `1.0` | `1.05` | **Óptimo:** encuadre limpio con `object-center`. |
| **Novias (`Novias`)** | [`src/components/Novias.tsx:58`](../src/components/Novias.tsx#L58) | `1.0` | `1.03` (solo `md:`) | **Óptimo:** transición suave sin deformación. |

---

## 2. Especificación SDD (Spec-Driven Development)

### 2.1. Reglas de Zoom y Encuadre (`RF-ZOOM-01`)
- **DADO** un producto en los carruseles de portada (`Novedades.tsx`) dentro de una tarjeta `aspect-square` (1:1),
- **CUANDO** se renderiza en reposo (móvil o escritorio),
- **ENTONCES** debe aplicar `ZOOM_FOTO_HOME = 1.1` (`--zoom-base: 1.1`) con `OBJECT_POSITION_FOTO_HOME = "center center"`, y un máximo de `calc(var(--zoom-base) * 1.05)` (`1.155`) en `group-hover`.
- **POR QUÉ:** En `1.18` (+18%), arreglos con globos elevados (p. ej. *Arreglo Bienvenida Bebé con Jirafita*, *Canasta Girasoles & Estrella Dorada*) quedaban al límite del borde superior. Con `1.1` (+10%) se recupera ~8% de aire perimetral sin perder protagonismo floral ni forzar nitidez en `srcset={[480, 960]}`.

### 2.2. Reglas de Popup Club en Móvil (`RF-POPUP-02`)
- **DADO** el modal `PopupModal.tsx` abierto en dispositivos móviles (`< 768px`),
- **CUANDO** el usuario visualiza o interactúa con el formulario:
  1. La imagen promocional se muestra como miniatura vertical íntegra (`w-20 h-24 rounded-xl md:hidden`) junto al título, evitando recortes horizontales.
  2. El contenedor usa `max-h-[90dvh]` con `overflow-y-auto overscroll-contain` para soportar la barra inferior de iOS Safari y el teclado virtual.
  3. Los campos `<input>` usan `text-base sm:text-sm` (`>= 16px` en móvil) para prevenir el zoom automático de iOS Safari, sin `autoFocus` al abrirse.
  4. En escritorio (`>= 768px`) se mantiene el layout horizontal en 2 columnas (`md:w-5/12`).

### 2.3. Reglas de SEO Técnico Fase 1 (`RF-SEO-FASE1`)
- `/producto/:id`: SSR completo con `<title>`, `description`, `<link rel="canonical">`, `<h1>`, `Schema.org Product` + `Offer` (`PEN`) + `MerchantReturnPolicy` fiel a `/cambios-y-devoluciones`, `404` real para IDs inexistentes y `301` canónico si cambia el slug.
- `/`: `<h1>` visible (*"Florería en Miraflores con delivery de flores el mismo día en Lima"*) + subtítulo (*"Pedidos antes de las 5:00 p.m. llegan el mismo día."*).
- `/sitemap.xml`: dinámico desde Supabase (`src/lib/sitemap.ts` + `src/server.ts`), sin `public/sitemap.xml` estático, `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- `X-Robots-Tag: noindex, nofollow`: inyectado exclusivamente cuando el host termina en `.vercel.app`.

---

## 3. Plan y Criterios de Aceptación Verificados

- **TypeScript (`npm run typecheck`):** 0 errores.
- **Linter (`npm run lint`):** 0 errores.
- **Pruebas unitarias (`npm test`):** 22/22 archivos, 200/200 tests aprobados.
- **Pruebas E2E Playwright (`tests/e2e/popup-modal.spec.ts`):** 8/8 tests aprobados en `[mobile]` (390×844, 360×640, verificación `fontSize >= 16px`, sin `autoFocus`) y `[desktop]` (1280×720).
