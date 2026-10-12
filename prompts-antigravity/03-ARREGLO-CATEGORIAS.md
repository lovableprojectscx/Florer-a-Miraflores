# PROMPT 03 — Arreglo de categorías (después del diagnóstico y las decisiones)

> ⚠️ **Antes de pegar:** completa las dos líneas de DECISIONES con lo que elegiste tras leer `docs/DIAGNOSTICO-CATEGORIAS.md`.

---

```
DECISIÓN D1 (Niño/Niña):  A | B | C      ← deja solo una
DECISIÓN D2 (Tulipanes):  A | B          ← deja solo una
Resultado del SQL de diagnóstico: <pega aquí lo relevante o "corrido, ver docs/DIAGNOSTICO-CATEGORIAS.md">
```

Rama: `fase-03-categorias`. Lee primero `docs/DIAGNOSTICO-CATEGORIAS.md`. Haz **solo** lo que corresponde a las decisiones de arriba.

## Parte 1 — Siempre (independiente de D1/D2)

Estos arreglos van sí o sí porque son la raíz de los errores de carga:

1. **Selector de categoría en admin de productos** (`src/routes/admin/productos.tsx`): agrupa con `<optgroup label="Padre">` y muestra cada opción como "Padre › Hija" para que no haya dos "Ramos" iguales. Las categorías padre sin hijas (Arreglos Premium, Ofertas) siguen siendo seleccionables. Reutiliza el patrón que ya se usó en `colecciones-home` (commit `7f21255`). Muestra las inactivas marcadas "(inactiva)" para que la encargada entienda por qué un producto no se ve.
2. **Errores del admin de categorías** (`src/routes/admin/categorias.tsx`): reemplaza los `alert()` por `toast.error` (sonner). Si el error es de slug duplicado (código Postgres `23505`), el mensaje debe decir: "Ya existe una categoría con el slug «X»" y, si esa categoría está inactiva, "…está inactiva: actívala en vez de crear otra". Cambia también los `alert()` de `admin/productos.tsx` si los hay.
3. **Aviso de visibilidad:** en la lista del admin de categorías, muestra un indicador cuando una categoría activa tiene **0 productos activos** ("no se verá con productos en la web"), y cuando una subcategoría está activa pero su padre no.

## Parte 2 — Según D1

- **A o B:** no hay código. Escribe en `docs/GUIA-PANEL-CATEGORIAS.md` el paso a paso exacto para que la encargada lo haga desde el panel (crear/activar, slugs sugeridos `nacimiento-nino` y `nacimiento-nina`, orden, imagen, y cómo reasignar productos). Si el diagnóstico mostró que `nacimientos` existe inactiva, el paso 1 es **activarla**, no crear otra. Prepara también, por si Jack prefiere hacerlo él, `docs/sql/0XX-nacimientos.sql` idempotente (con `on conflict (slug) do update`). Jack decide cuál usar; tú no lo ejecutas.
- **C:** detente y pide confirmación a Jack antes de programar el tercer nivel; impacta rutas, menú, filtros, breadcrumbs y admin.

## Parte 3 — Según D2

- **A:** guía en `docs/GUIA-PANEL-CATEGORIAS.md` para reasignar los productos de tulipanes a la subcategoría correcta (lista los productos que encontró el diagnóstico).
- **B — Categorías adicionales:**
  1. `docs/sql/0XX-categorias-extra.sql`: columna `categorias_extra uuid[] not null default '{}'` en `productos` + índice GIN. Sin tocar la policy (la lectura pública ya cubre la tabla; confírmalo con el SQL de policies del diagnóstico). Incluye el SQL para revertir.
  2. Queries (`src/lib/queries.ts`): `getProductosPorCategoria` y `getProductosPorCategorias` devuelven productos cuya `categoria_id` esté en la lista **o** cuyo `categorias_extra` se solape (`.or("categoria_id.in.(...),categorias_extra.ov.{...}")`). Sin duplicados. Y el filtro del `/catalogo` (`src/routes/catalogo.tsx`) debe considerar también `categorias_extra`.
  3. Tipos en `src/types/database.ts`.
  4. Admin de productos: multiselect "También mostrar en…" con el mismo agrupado por padre.
  5. El código debe funcionar **antes y después** de que Jack corra el SQL (si la columna aún no existe, no puede romper el catálogo). Explica cómo lo garantizaste.

## Tests

- **Vitest:** helper que arma las opciones agrupadas (padre › hija, inactivas marcadas); mapeo de error `23505` a mensaje amigable; si hay D2-B, la lógica de filtrado del catálogo con `categorias_extra` (sin duplicados).
- **Playwright:** `categorias.spec.ts` — cada categoría padre del menú abre su página sin 404 y muestra productos o el estado vacío correcto; cada subcategoría enlazada desde la página padre abre sin 404. Si D1 ya se configuró en el panel, verifica que Nacimientos (o Niño/Niña) aparece y abre. Admin (con credenciales): el `<select>` de categoría tiene `optgroup`s.

## Documentación

- `docs/GUIA-PANEL-CATEGORIAS.md` (para la encargada: lenguaje simple, sin jerga).
- Si hubo SQL: `docs/BASE-DE-DATOS.md` actualizado.
- `docs/ACTUALIZACIONES.md`, y marca en `spec-kit/tasks.md` lo que quedó resuelto (y lo que depende del panel).

## Criterios de aceptación

- [ ] No hay dos opciones indistinguibles en el selector de categorías.
- [ ] Ningún `alert()` en los admin de categorías y productos.
- [ ] Guía del panel lista para la encargada.
- [ ] `npm run verify` y `npm run test:e2e` pasan.

Entrega el reporte del Prompt 00, con una sección clara: **"Lo que tiene que hacer la encargada en el panel"**.
