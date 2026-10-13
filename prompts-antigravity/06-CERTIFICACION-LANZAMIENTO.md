# PROMPT 06 — Certificación pre-lanzamiento (go / no-go)

> Última fase antes de salir al aire. No agrega funciones: prueba todo, arregla lo que bloquee y deja un acta de certificación con evidencia.

---

Rama: `fase-06-certificacion`, partiendo de `master` **con las fases 01–05 ya mergeadas** (confírmalo con `git log` en el reporte).

## 1. Regresión completa

Corre y guarda la salida en `docs/evidencias/fase-06/`:

- `npm run verify`
- `npm run test:coverage` → anota % de líneas en `src/lib`, `src/store`, `src/hooks` (meta: ≥ 80 % en esas tres carpetas; si no llegas, lista qué falta).
- `npm run test:rls`
- `npm run test:e2e` (mobile + desktop) con credenciales de admin cargadas.

## 2. Pruebas nuevas de lanzamiento

1. **Imágenes rotas** — `scripts/verificar-imagenes.mjs` (solo lectura, anon key): recorre todos los productos activos, banners y colecciones; hace `HEAD` a cada URL de imagen; reporta en `docs/evidencias/fase-06/imagenes.md` las que no den 200, los productos activos **sin imagen** y las imágenes de más de 1 MB (pesan en el egress). Concurrencia máxima 5.
2. **Recorrido completo (E2E `recorrido-compra.spec.ts`)**: home → menú → categoría → subcategoría → producto → agregar → drawer → checkout → (pedido interceptado, Regla de oro) → confirmación. En mobile y desktop.
3. **Sin scroll horizontal** en todas las rutas públicas a 360, 390 y 1440 px.
4. **Enlaces internos**: desde el menú y el footer, todo enlace interno responde sin 404.
5. **WhatsApp**: el FAB y el botón de confirmación apuntan a `wa.me/` con el número de `config` y el texto del pedido.
6. **Accesibilidad básica**: toda `<img>` de producto tiene `alt` no vacío; los botones tienen nombre accesible; foco visible en el checkout.
7. **Botones del Home (RF-017 y RF-018)**: la matriz los marca ❌ pero **ya están programados** en `src/components/Novedades.tsx` (botón "Agregar" y "Compartir" con Web Share API y copia al portapapeles). Certifícalos con E2E `home-acciones.spec.ts`: "Agregar" suma al carrito y abre el drawer sin navegar al producto; "Compartir" en desktop copia `/producto/<slug>-<id>` (concede permiso de portapapeles en el contexto de Playwright) y muestra "¡Copiado!". Si el portapapeles falla hoy no hay ningún aviso (catch silencioso): agrega un `toast` de error. Luego actualiza RF-017 y RF-018 a ✅ en `docs/REQUISITOS-FUNCIONALES.md`.

## 3. SEO y técnico

- Hoy **no existe** `public/robots.txt`. Créalo: permitir todo, bloquear `/admin`, y apuntar al sitemap.
- Sitemap: genera `sitemap.xml` con las rutas públicas, categorías y productos activos. Propón cómo mantenerlo al día (generado en build con un script que lee Supabase, o ruta de servidor). Implementa la opción más simple que funcione en Vercel y explica la elegida.
- Verifica `<title>` y `meta description` por ruta según `CLAUDE.md` §14. Lista los que falten (Open Graph, schema `Florist` en el home); arregla los que sean de una línea, el resto al reporte.
- Lighthouse **mobile** (Chrome DevTools o `npx lighthouse`) sobre el build de producción (`npm run build` + `npm run preview`, o la URL de preview de Vercel) en `/`, `/catalogo` y un `/producto/:id`. Guarda los JSON/HTML en `docs/evidencias/fase-06/lighthouse/`. Metas: Performance ≥ 70, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90. Si no se cumplen, lista las 3 causas principales de cada una; **no** te pongas a optimizar todo, solo lo que sea rápido y seguro.

## 4. Seguridad (checklist con evidencia)

- [ ] No hay secrets en el bundle: busca en `dist/` cadenas como `service_role`, `IZIPAY`, `sk_`, `password`.
- [ ] `.env.local` y `.env.e2e.local` no están en git (`git ls-files | grep env`).
- [ ] RLS verificado por `test:rls`.
- [ ] Rutas `/admin/*` redirigen sin sesión (E2E).
- [ ] Sin `console.log` nuevos en `src/` (lista los antiguos que queden).
- [ ] Riesgo de montos documentado en `docs/SEGURIDAD.md` (Fase 05).

## 5. Checklist manual para Jack (celular real)

Crea `docs/CHECKLIST-MANUAL-LANZAMIENTO.md` con pasos cortos que Jack hace en **su celular** sobre la URL de preview de Vercel: abrir home, buscar un producto, agregar 2, cambiar cantidades, checkout con su distrito, ver confirmación, abrir WhatsApp; en el admin, ver el pedido de prueba y moverlo por los estados; borrar/cancelar el pedido de prueba. Cada paso con casilla y espacio para "OK / falla + captura".

## 6. Documentación final

- **`docs/CERTIFICACION-LANZAMIENTO.md`** (el acta): fecha, commit, rama de deploy, versión de Node, resultado de cada suite (números reales), cobertura, Lighthouse, imágenes rotas, checklist de seguridad, pendientes conocidos (IZIPay, correo, P2) y un veredicto **GO / NO-GO** con las condiciones. Si es NO-GO, qué falta exactamente.
- **`CLAUDE.md`**: corrige §3 (stack real: TanStack Start + TanStack Router, SSR, Vercel) y deja §4 marcado "pendiente de decisión con Sofía" apuntando a `brand/README.md`. Actualiza la tabla de estado de §2.
- `docs/README.md` (índice con TESTING, SEGURIDAD, CERTIFICACION, CHECKLIST, GUIA-PANEL-CATEGORIAS), `docs/ACTUALIZACIONES.md`, `docs/REQUISITOS-FUNCIONALES.md`, `spec-kit/tasks.md` (P1 cerrado), `CONTINUAR.md` (estado nuevo).

## Criterios de aceptación

- [ ] Todas las suites en verde (o fallas listadas como bloqueantes con su causa).
- [ ] `robots.txt` y sitemap listos en la rama (llegan a producción cuando Jack haga el merge).
- [ ] Acta de certificación con veredicto y evidencia.
- [ ] Checklist manual entregado a Jack.

Entrega el reporte del Prompt 00 y, al final, **el veredicto GO/NO-GO en una línea**.
