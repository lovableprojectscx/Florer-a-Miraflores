# Reporte — Fase 06-G: Cabecera Compacta en Páginas de Listado

**Rama:** `fase-06g-cabecera`  
**Fecha:** 14 de Octubre de 2026  
**Estado:** ✅ COMPLETADO Y VERIFICADO

---

### 1. Resumen Ejecutivo

Se rediseñó la cabecera de todas las páginas de listado de productos (`/catalogo`, `/categoria/$slug`, `/categoria/$slug/$sub`, `/tag/$key`) para optimizar el espacio vertical inicial (_above the fold_), logrando que la **primera fila de productos sea visible sin scroll en resoluciones de escritorio 1366×768 y 1440×900**, así como una presentación compacta y legible en celulares (390px).

---

### 2. Qué Hice

1. **Ruta de Navegación (Breadcrumb) + Eyebrow en una sola línea integrada:**
   - Se unificó el breadcrumb y el eyebrow editorial (ej. `— toda la colección`, `— colección`, `— ocasiones`, `— colección especial`) en una sola línea horizontal compacta con altura reservada mínima (`mb-2 md:mb-3`).
   - Mantiene la elegancia tipográfica de la marca (`font-italic-serif text-rose-accent lowercase`).

2. **Título de Categoría Compacto:**
   - Reducción del tamaño del `<h1>`:
     - **Celular (390px):** `text-2xl` (~24px), cumpliendo la pauta de 24–26px.
     - **Escritorio (1366px y 1440px):** `text-[32px] lg:text-[34px]`, cumpliendo la pauta de 32–36px.
   - Antes: `text-4xl md:text-6xl` (36px en móvil y 60px en escritorio), lo que ocupaba gran parte de la pantalla inicial.

3. **Filtros en la Misma Franja Horizontal en Escritorio:**
   - En `src/components/ProductFilters.tsx` (`ProductFiltersBar`), el título, la descripción opcional y el contador de productos (`Mostrando X productos`) se alinean horizontalmente con los selectores de filtros en desktop (`lg:flex-row lg:items-end lg:justify-between`).
   - Se eliminaron las barras dobles de separación `border-y` con márgenes excesivos, reemplazándolas por un único borde inferior sutil (`border-b border-[#E8DDD0]/70 pb-4 mb-6 md:mb-8`).
   - En celulares, los selectores se organizan en una cuadrícula compacta de 2 columnas (`grid-cols-2`), optimizando el espacio sin provocar desbordamiento horizontal.

4. **Reducción de Espacio Vertical:**
   - `<main>` pasó de `py-10 md:py-16` (padding superior de 40px en móvil y 64px en escritorio) a `pt-4 md:pt-6 pb-12 md:pb-16`.
   - Se redujo la distancia desde el header hasta la primera tarjeta de producto a ~245–260px (antes ~480px).

5. **Páginas Actualizadas:**
   - `src/routes/catalogo.tsx`
   - `src/routes/categoria.$slug.tsx` (con subcategorías accesibles mediante pills compactos en la parte superior y tarjetas visuales al final de la página para descubrimiento)
   - `src/routes/categoria.$slug.$sub.tsx`
   - `src/routes/tag.$key.tsx`

---

### 3. Evidencias de Pruebas

1. **Test E2E Automatizado (`tests/e2e/cabecera-compacta.spec.ts`):**
   - Mide directamente la coordenada `y` del _bounding box_ de la primera tarjeta de producto en resoluciones 1366×768 y 1440×900 sin scroll.
   - Verifica que el título `<h1>` tenga `fontSize` entre 30px y 38px en escritorio, y entre 22px y 28px en móvil.
   - Verifica que `nav[aria-label="Ruta de navegación"]` contenga tanto la ruta como el eyebrow (`—`).
   - **Resultado:** 18 tests ejecutados en móvil y escritorio, **18 passed (100% éxito)**.

2. **Batería de Verificación (`npm run verify`):**
   - Lint: 0 errores.
   - Typecheck (`tsc --noEmit`): 0 errores.
   - Unit tests (`vitest run`): 104 passed en 11 archivos de test.
   - Build (`vite build`): compilación de cliente y servidor exitosa.
   - Evidencia guardada en `docs/evidencias/fase-06g/verify.txt`.

3. **Batería E2E Completa (`docs/evidencias/fase-06g/e2e.txt`):**
   - 95 tests passed, 8 skipped (tests con mutación que requieren bandera explícita).

4. **Capturas Comparativas (Antes / Después):**
   - **Catálogo:**
     - 1366×768: `docs/evidencias/fase-06g/antes/catalogo-1366-antes.png` vs `docs/evidencias/fase-06g/despues/catalogo-1366-despues.png`
     - 1440×900: `docs/evidencias/fase-06g/antes/catalogo-1440-antes.png` vs `docs/evidencias/fase-06g/despues/catalogo-1440-despues.png`
     - 390×844: `docs/evidencias/fase-06g/antes/catalogo-390-antes.png` vs `docs/evidencias/fase-06g/despues/catalogo-390-despues.png`
   - **Categoría (Tulipanes):**
     - 1366×768: `docs/evidencias/fase-06g/antes/categoria-tulipanes-1366-antes.png` vs `docs/evidencias/fase-06g/despues/categoria-tulipanes-1366-despues.png`
     - 1440×900: `docs/evidencias/fase-06g/antes/categoria-tulipanes-1440-antes.png` vs `docs/evidencias/fase-06g/despues/categoria-tulipanes-1440-despues.png`
     - 390×844: `docs/evidencias/fase-06g/antes/categoria-tulipanes-390-antes.png` vs `docs/evidencias/fase-06g/despues/categoria-tulipanes-390-despues.png`
   - **Subcategoría (Cumpleaños):**
     - 1366×768: `docs/evidencias/fase-06g/antes/subcategoria-1366-antes.png` vs `docs/evidencias/fase-06g/despues/subcategoria-1366-despues.png`
     - 1440×900: `docs/evidencias/fase-06g/antes/subcategoria-1440-antes.png` vs `docs/evidencias/fase-06g/despues/subcategoria-1440-despues.png`
     - 390×844: `docs/evidencias/fase-06g/antes/subcategoria-390-antes.png` vs `docs/evidencias/fase-06g/despues/subcategoria-390-despues.png`
