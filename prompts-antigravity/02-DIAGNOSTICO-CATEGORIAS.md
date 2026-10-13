# PROMPT 02 — Diagnóstico de categorías (solo lectura, NO arregles nada)

> Objetivo: encontrar la causa real de los 3 reclamos de categorías antes de tocar código. El arreglo va en la Fase 03, después de que Jack decida.

---

Rama: `fase-02-diagnostico-categorias`.

## Los reclamos de la clienta

1. **"Nacimientos" no se refleja en la web** (y "no le deja subirla").
2. Quiere **dividir Nacimientos en Niño y Niña**.
3. **"Tulipanes" no se refleja en Ramos y Arreglos.**

## Lo que ya se sabe del código (verifícalo, no lo des por hecho)

- Un producto tiene **una sola** categoría: `productos.categoria_id`. No existe relación muchos-a-muchos.
- `/categoria/:slug` muestra productos de la categoría padre + sus hijas directas (`src/routes/categoria.$slug.tsx`). `/categoria/:slug/:sub` muestra solo los de esa subcategoría.
- `getCategoriaPorSlug` y `getCategorias` filtran `activo = true` (`src/lib/queries.ts`). Una categoría inactiva da 404 y desaparece del menú.
- La ruta solo soporta **2 niveles** (padre → sub). Según `CLAUDE.md` §8, Nacimientos ya es hija de Ocasión, así que "Niño/Niña" debajo sería un **tercer nivel** que hoy no existe.
- En el admin de productos (`src/routes/admin/productos.tsx`, el `<select>` de categoría) las categorías salen en una **lista plana solo con el nombre**. "Ramos" existe dos veces (Arreglos Florales › Ramos y Tulipanes › Ramos) y "Arreglos" se confunde con "Arreglos Florales". Es fácil asignar a la equivocada.
- El admin de categorías (`src/routes/admin/categorias.tsx`) muestra `alert("…Revisa si el slug ya existe.")` al fallar el guardado. Si ya existe una categoría `nacimientos` (aunque esté **inactiva**), crear otra con el mismo slug choca con el `UNIQUE` y la clienta ve "no me deja".
- Commit `fa7eaf6`: se sacó "nacimientos" del collage del home. Revisa si eso también tocó algo más.

## Qué tienes que hacer

1. Crea `scripts/diagnostico-categorias.mjs` (Node, usa `@supabase/supabase-js` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` de `.env.local`). **Solo SELECT.** Que imprima:
   - El árbol completo de categorías **visibles para anon** con: nombre, slug, `activo`, `orden`, `parent_id`, y nº de productos activos asignados directamente.
   - Categorías huérfanas (parent_id que no existe) y subcategorías con 0 productos.
   - Productos activos cuyo nombre contenga "tulip" y en qué categoría (con su padre) están asignados.
   - Productos activos cuyo nombre contenga "nacimiento", "bebé", "bebe", "baby", "niño", "niña" y su categoría.
   - Si encuentra `nacimientos` o no.

   ⚠️ Con la anon key solo se ven las filas que la policy permite. Si la policy de `categorias` solo deja ver `activo = true`, una Nacimientos **inactiva no aparecerá**. Por eso:

2. Prepara `docs/sql/diagnostico-categorias.sql` **solo con SELECTs** para que Jack lo corra en el SQL Editor (ahí sí se ve todo): todas las filas de `categorias` (incluidas inactivas), conteo de productos por categoría (activos e inactivos), las policies de `categorias` y `productos` (`select * from pg_policies where tablename in ('categorias','productos')`), y los constraints de `categorias`.
3. Reproduce el "no me deja subir" en local: en `/admin/categorias` intenta crear una categoría con un slug que ya exista. Anota el mensaje exacto que ve el usuario. **No guardes nada en producción**: si para reproducir tendrías que escribir en la BD, no lo hagas; deduce desde el código y el SQL, y dilo.
4. Revisa el menú (`src/components/Header.tsx`) y el home (`CategoryShowcase`, colecciones) para ver de dónde sale cada categoría y por qué una podría no mostrarse.

## Entregable: `docs/DIAGNOSTICO-CATEGORIAS.md`

Para **cada** reclamo:

- **Causa confirmada** (con la evidencia: salida del script o del SQL), o **hipótesis pendiente** de que Jack corra el SQL.
- Clasificación: 🧑‍💻 código · ⚙️ config del panel · 🗄️ cambio de BD.
- Opciones de arreglo con esfuerzo (S/M/L) y riesgo.

Y una sección **"Decisiones que necesito de Jack"** con, como mínimo:

- **D1 · Niño/Niña:**
  - A) Dos subcategorías planas bajo Ocasión: "Nacimiento Niño" y "Nacimiento Niña". Cero código.
  - B) Nacimientos pasa a categoría **padre** (aparece en el menú principal) con subcategorías Niño y Niña. Cero código; cambia el menú.
  - C) Soportar un tercer nivel. Código en rutas, menú, filtros y admin. No recomendado.
- **D2 · Tulipanes en Ramos/Arreglos:** si la clienta quiere que un mismo producto aparezca en "Tulipanes › Ramos" **y** en "Arreglos Florales › Ramos":
  - A) Reasignar productos (no aparecen en los dos lados). Config.
  - B) "Categorías adicionales" por producto (columna `categorias_extra uuid[]` o tabla puente). Código + SQL.

## Criterios de aceptación

- [ ] Ningún dato de producción modificado.
- [ ] Script y SQL de diagnóstico en el repo, documentados.
- [ ] `docs/DIAGNOSTICO-CATEGORIAS.md` con causa o hipótesis para los 3 reclamos y las decisiones D1/D2.
- [ ] `npm run verify` sigue pasando.

Entrega el reporte del Prompt 00. Después **espera**: Jack corre el SQL, decide D1/D2 y recién ahí va la Fase 03.
