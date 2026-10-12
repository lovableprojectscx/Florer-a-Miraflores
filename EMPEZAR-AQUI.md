# EMPEZAR AQUÍ — Handoff del proyecto Florería Miraflores

> Documento de arranque para una sesión/chat nuevo (o un modelo distinto). Léelo primero: te da todo el contexto y te dice dónde está cada cosa. La conversación anterior no se traslada, pero TODO el contexto importante está en estos archivos.

## Qué es esto

E-commerce de flores para Lima (Florería Miraflores). React 19 + TanStack Start, Supabase (BD + Storage + Auth), deploy en Vercel, pago IZIPay (pendiente). Catálogo, carrito, checkout con delivery por distritos y panel admin completo. Ya tiene ~300 productos cargados; se prepara el lanzamiento.

## Lee estos archivos en este orden

1. **`CLAUDE.md`** (raíz) — especificación completa del proyecto: stack, rutas, identidad visual, base de datos, reglas. Es la fuente de verdad.
2. **`docs/README.md`** — índice de toda la documentación técnica.
3. **`docs/PLAN-DE-TRABAJO.md`** — ⭐ lo pendiente, priorizado. **Aquí está lo que sigue.**
4. **`docs/REQUISITOS-FUNCIONALES.md`** — matriz de requisitos (RF/RNF) con estado.
5. **`docs/ARQUITECTURA.md`** — stack real, diagramas, estructura de carpetas.
6. **`docs/BASE-DE-DATOS.md`** — tablas Supabase, RLS, Storage.
7. **`docs/ACTUALIZACIONES.md`** e **`INCIDENCIAS-Y-SOLUCIONES.md`** — historial de cambios y bugs resueltos.

## Marca y prompts de imágenes

- **`brand/`** — identidad visual: `README.md` (guía), `tokens.css` (colores/tipografía), `logo/` (logo SVG + variantes).
- **`brand/PROMPT-MAESTRO-FOTOS.md`** y **`brand/PROMPT-MAESTRO-BANNERS.md`** — prompts para generar fotos de producto y banners con la IA de Google (Flow / Nano Banana). Copia también en `Downloads/prompts/` junto con `RECURSOS-IA-DISENO.md`.

## Estado actual (resumen)

- ✅ Listo: catálogo con filtros, producto, carrito, checkout con delivery, confirmación, panel admin, Supabase + RLS, logo SVG, brand kit, prompts de imágenes.
- ⏳ En marcha: lanzamiento. Ver `docs/PLAN-DE-TRABAJO.md`.
- ❌ Bloqueado: IZIPay (faltan credenciales de Sofía) y correo automático.

## Lo que sigue (de PLAN-DE-TRABAJO.md)

**P1 antes de lanzar:** paginación del catálogo, fotos más grandes (estilo Lima Floral), arreglar categorías (Nacimientos no aparece / dividir en niño-niña / Tulipanes sin reflejar), estado "En preparación".
**P2 post-lanzamiento:** página de reseñas/testimonios, correo automático, botones de carrito/compartir en Home.
**P3:** reseñas de Google Maps (API), IZIPay (credenciales).

## Cómo trabajar aquí

- El dueño (Jack / IDENZA) es consultor, no programador de este stack a diario: explícale en simple, sé honesto con lo que es viable, y distingue qué es **código** vs **configuración del panel** vs **bloqueado por terceros**.
- Antes de tocar código, lee `CLAUDE.md` (convenciones) y verifica en `src/` cómo está hecho de verdad (el `CLAUDE.md` tiene algunas divergencias con el código, marcadas con ⚠️ en los docs).
- Responde en español, tono cercano (le dicen "mi pana").

---

### Cómo pasar el trabajo a un chat nuevo (instrucciones para Jack)

1. Abre un **chat nuevo** en Cowork con **esta misma carpeta conectada** (`floreria-miraflo-main`).
2. Cambia el modelo si quieres (arriba en la app).
3. Pega este mensaje para arrancar:

> Lee el archivo `EMPEZAR-AQUI.md` y luego `docs/PLAN-DE-TRABAJO.md`. Ese es el contexto del proyecto. Cuando termines, dime por dónde seguimos.

Con eso el chat nuevo queda al día sin necesidad de la conversación anterior.
