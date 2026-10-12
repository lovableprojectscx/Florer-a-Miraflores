# PROMPT 04 — Catálogo: fotos más grandes + "Ver más" (lotes de 24)

> Misma zona de código (`ProductGrid`), por eso van juntas. Es lo de mayor impacto visual antes del lanzamiento.

---

Rama: `fase-04-catalogo`.

## Situación actual (verificada en el código)

- `src/components/ProductGrid.tsx` en "modo externo" renderiza **todos** los productos que recibe, en `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`, tarjetas `aspect-[3/4]`. En pantallas grandes salen 5 por fila y se ven chicas.
- Se usa en: `src/routes/catalogo.tsx`, `categoria.$slug.tsx`, `categoria.$slug.$sub.tsx`, `tag.$key.tsx` y `producto.$id.tsx` (relacionados).
- Los filtros (categoría, ocasión, precio, orden) se aplican **en el cliente** sobre la lista completa (`useProductFilters`). Con ~300 productos el JSON es liviano; lo pesado son las **imágenes** (egress de Storage, plan free ~5 GB/mes) y el DOM en celular.

## Decisión técnica (no la cambies sin consultar)

"Ver más" **en el cliente**: los filtros siguen trabajando sobre la lista completa y solo se **renderizan** 24 tarjetas por lote. Así no se rompe ningún filtro ni orden, y como las imágenes son `lazy`, se descargan solo las que se ven. Paginación en servidor queda fuera de alcance (anótalo como mejora futura si el catálogo pasa de ~1000).

## 1. Paginación "Ver más"

- Hook nuevo `src/hooks/use-ver-mas.ts` → `useVerMas<T>(items: T[], tamanoLote = 24)` que devuelve `{ visibles, total, mostrando, hayMas, verMas }`.
- **Se reinicia a 24** cuando cambia la lista filtrada (cambio de filtro u orden). Ojo con dependencias: compara por una clave estable (ids + longitud), no por identidad del array, para no resetear en cada render.
- `ProductGrid` recibe `tamanoLote?: number`. Si no se pasa o la lista es ≤ lote, no muestra botón (los relacionados del producto no paginan).
- Debajo del grid: texto "Mostrando 24 de 312" con `aria-live="polite"` y botón **"Ver más"** con el estilo de botón secundario existente (borde `#2C2420`, uppercase, tracking). Al hacer clic, el foco pasa a la primera tarjeta nueva (accesibilidad) sin saltar el scroll.
- Aplica `tamanoLote={24}` en catálogo, categoría, subcategoría y tag.

## 2. Fotos más grandes (referencia: Lima Floral)

Si puedes abrir https://limafloral.com con el navegador, míralo en móvil y escritorio y anota qué tomas como referencia. No copies su marca, solo la proporción foto/tarjeta.

- Grid: `grid-cols-2` en celular (se mantiene), `md:grid-cols-3`, **máximo `xl:grid-cols-4`**. Nada de 5 o 6 columnas en el catálogo.
- Imagen protagonista: proporción `aspect-[4/5]`, ocupa todo el ancho de la tarjeta; menos relleno alrededor; el bloque de texto más compacto (nombre + precio). El botón "Agregar al carrito" se mantiene.
- En celular, el nombre puede ir en 2 líneas (`line-clamp-2`) para que no se corte feo.
- Si un producto no tiene imágenes (`imagenes` vacío o null), hoy `p.imagenes[0]` es `undefined`: muestra el placeholder de forma explícita, sin depender del `onError`.
- Agrega `decoding="async"` y `sizes` coherentes con el grid.
- **No cambies** colores de marca, badges ni textos en esta fase.
- El "modo home" (productos estáticos) del mismo componente no se toca, salvo que compartan clases; si lo afectas, dilo.

## 3. Tests

- **Vitest** (`use-ver-mas.test.ts`): 0 items, menos de 24, exactamente 24, 25, 300; `verMas` suma de a 24 sin pasarse; reset al cambiar la lista; no resetea si la lista es la misma con otra identidad.
- **Vitest** (`ProductGrid.test.tsx`): con 30 productos muestra 24 y el botón; tras clic muestra 30 y el botón desaparece; producto sin imágenes muestra placeholder.
- **Playwright** (`catalogo-paginacion.spec.ts`):
  - `/catalogo` muestra como máximo 24 tarjetas al inicio y el texto "Mostrando 24 de N" con N real.
  - "Ver más" agrega hasta 24 más; al llegar al total el botón desaparece.
  - Cambiar un filtro vuelve a 24.
  - **Mobile:** exactamente 2 columnas (compara el `boundingBox().y` de las tarjetas 1, 2 y 3). **Desktop 1440:** como máximo 4 por fila. Ninguna página tiene scroll horizontal (`scrollWidth <= clientWidth`).
  - Una tarjeta en mobile tiene al menos ~165 px de ancho.

## 4. Evidencia visual

Capturas antes/después en `docs/evidencias/fase-04/`: `/catalogo` a 390 px y a 1440 px (página completa del primer lote). Las de "antes" sácalas **antes** de cambiar código.

## 5. Documentación

- `docs/ACTUALIZACIONES.md`: nueva versión con el cambio.
- `docs/REQUISITOS-FUNCIONALES.md`: actualiza el estado de los requisitos de catálogo afectados.
- `spec-kit/tasks.md`: marca paginación y fotos grandes.
- `docs/ARQUITECTURA.md`: una línea sobre la decisión "Ver más en cliente".

## Criterios de aceptación

- [ ] Catálogo, categoría, subcategoría y tag cargan 24 y paginan; relacionados no.
- [ ] 2 columnas en celular, máximo 4 en escritorio, fotos 4:5.
- [ ] Filtros y orden siguen funcionando igual (los E2E de la Fase 01 siguen verdes).
- [ ] Capturas antes/después en el repo.
- [ ] `npm run verify` y `npm run test:e2e` pasan.

Entrega el reporte del Prompt 00.
