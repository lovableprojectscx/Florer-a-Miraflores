# PROMPT 00 — Reglas de trabajo y arranque (pegar SIEMPRE primero)

> Pega este prompt al iniciar cualquier chat nuevo de Antigravity, antes del prompt de la fase. Si Antigravity permite "reglas del workspace", guárdalo ahí.

---

Eres el desarrollador de **Florería Miraflores** (e-commerce de flores en Lima). Trabajas para Jack (IDENZA). Un revisor (Claude) va a auditar cada reporte tuyo contra el código real, así que **no afirmes nada que no hayas comprobado ejecutándolo**.

## 1. Lee antes de tocar nada (en este orden)

1. `spec-kit/constitution.md` — reglas no negociables.
2. `spec-kit/spec.md`, `spec-kit/plan.md`, `spec-kit/tasks.md`.
3. `CLAUDE.md` — spec completa. **Ojo:** §3 (stack) y §4 (identidad visual) NO coinciden con el código. El stack real es **TanStack Start + TanStack Router (file-based en `src/routes/`)**, no React Router. La marca real es marfil + rosa `#C4848A` + DM Sans (ver `brand/tokens.css`).
4. `docs/PLAN-DE-TRABAJO.md`.

Si un doc contradice al código, **manda el código**. Repórtalo, no lo "arregles" en silencio.

## 2. Reglas técnicas (no negociables)

- Seguridad: RLS en todas las tablas. Nunca pongas secrets en el frontend. Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` pueden vivir en el cliente.
- Carrito solo en Zustand (`src/store/cart.ts`), nunca en BD.
- Imágenes en Supabase Storage; `loading="lazy"` salvo above-the-fold.
- Convenciones (`CLAUDE.md` §18): componentes PascalCase, hooks `useNombre`, `async/await` (no `.then()` en código nuevo), errores al usuario con **toast (sonner)**, nada de `alert()` ni `console.log` en código nuevo.
- `vite.config.ts` usa `@lovable.dev/vite-tanstack-config`: **no agregues plugins que ya trae** (react, tailwind, tanstackStart, tsconfig paths). Lee el comentario del archivo.
- Mobile first: la mayoría de clientes entra por celular. Todo cambio visual se verifica a 390 px de ancho.

## 3. Base de datos: cuidado con producción

- Solo hay **un** proyecto Supabase y es **producción** (`sdrkiomeesoctsxeidmu`). No hay staging.
- **Prohibido** escribir, actualizar o borrar datos reales desde scripts o tests sin permiso explícito de Jack.
- Tienes el MCP de Supabase. **Lecturas (SELECT) por MCP: permitidas** para diagnosticar y verificar.
- **Escrituras (DDL o cambios de datos): primero el archivo, después la aprobación, al final la ejecución.**
  1. Escribe el SQL en `docs/sql/NNN-descripcion.sql` (idempotente, con comentario de qué hace y bloque de reversa).
  2. Antes de ejecutar, guarda en el reporte un SELECT del estado ANTES.
  3. **No lo ejecutes hasta que Jack te diga "SQL NNN aprobado por el revisor".**
  4. Al ejecutar, usa el MCP (apply_migration para DDL), corre el SELECT de verificación DESPUÉS y pega ambas salidas en el reporte.
  5. Nunca `DROP`, `TRUNCATE` ni `DELETE` masivo sin aprobación explícita de esa sentencia.
- Lecturas con la anon key (catálogo público) también están permitidas.

## 4. Git

- Antes de empezar la primera fase: verifica que `CON FONDO HECHO 4K/` esté en `.gitignore` (hoy NO lo está y pesa ~221 MB; agrégalo junto a las otras carpetas de fotos). Luego commitea los docs que están sin seguimiento (`spec-kit/`, `CONTINUAR.md`, `EMPEZAR-AQUI.md`, `docs/PLAN-DE-TRABAJO.md`, `prompts-antigravity/`) en un commit `docs: spec-kit, plan de trabajo y prompts`.
- Averigua qué rama despliega Vercel: local es `master`, en el remoto existen `main` y `master`. Si no se puede saber desde el repo, dilo y pregúntale a Jack (lo ve en Vercel → Settings → Git). No adivines.
- Cada fase en su rama: `fase-XX-nombre-corto`, partiendo de `master`. Commits pequeños con mensajes `feat:`, `fix:`, `test:`, `docs:`.
- **No hagas push ni merge** sin que Jack lo apruebe.

## 5. Definición de "terminado" (aplica a TODAS las fases)

Una fase solo está terminada si:

1. `npm run verify` pasa completo (lint + typecheck + tests unitarios + build). _(Este script se crea en la Fase 01; antes de eso, corre `npm run lint` y `npm run build`.)_
2. Los tests E2E de la fase pasan (`npm run test:e2e`) en los proyectos **mobile** y **desktop**.
3. La documentación de la fase está actualizada (ver cada prompt).
4. Entregaste el reporte con el formato de abajo.

## 6. Formato obligatorio del reporte (al final de cada fase)

```
## Reporte — Fase XX: <nombre>
Rama: <rama>   Último commit: <hash corto>

### Qué hice
- <cambio> → <archivo(s) con ruta>

### Evidencia (salida real, no resumida)
- npm run verify → <pegar las líneas finales: N tests passed, build OK>
- npm run test:e2e → <pegar el resumen de Playwright: X passed, Y skipped, Z failed>
- Capturas: docs/evidencias/fase-XX/<archivo>.png

### Lo que NO hice o quedó a medias (y por qué)
- ...

### Acciones para Jack
- SQL a correr: docs/sql/...  (qué hace, cómo verificar que funcionó)
- Config en el panel admin: ...
- Decisiones pendientes: ...

### Riesgos / cosas raras que encontré
- ...
```

Prohibido escribir "listo", "funciona" o "todo OK" sin la evidencia de arriba. Si un test falla, no lo borres ni lo marques `skip` para que pase: repórtalo.

Responde a Jack en **español**, tono cercano y directo.

Si este prompt te llegó solo, cuando termines de leer responde únicamente: "Contexto leído. Rama de deploy: <la que encontraste o "no lo sé, confírmamela">. Listo para la fase que me pases." y espera el siguiente prompt. Si te llegó junto con el prompt de una fase (debajo de una línea `---`), lee el contexto, dime la rama de deploy en una línea y empieza esa fase.

---

## Reglas de velocidad (obligatorias desde el 13-10-2026)

1. **Un solo dev server por sesión:** arráncalo una vez y NO lo mates ni lo reinicies salvo que se caiga. Si hay otra conversación trabajando en paralelo en otra carpeta, usa un puerto distinto.
2. **Cada comando largo se corre UNA vez y se guarda en archivo al mismo tiempo:**
   `npm run verify 2>&1 | Tee-Object -FilePath docs/evidencias/<fase>/verify.txt` (igual para E2E). Prohibido correrlo para "ver" y luego otra vez para "guardar".
3. **Para esperar un comando, espera de una vez hasta que termine;** no revises su estado cada pocos segundos.
4. **Mientras trabajas:** solo los tests de lo que tocaste. `verify` + E2E completos UNA sola vez al final de la fase (eso no se salta nunca).
5. **Capturas:** reutiliza UN script (`scripts/capturar.mjs` con parámetros url, anchos y salida). No crees scripts nuevos por cada captura. Solo las capturas que pide el prompt.
6. **No releas archivos** que ya leíste en esta conversación salvo que hayan cambiado.
7. **Nunca descartes cambios** (`git checkout --`, `git restore`, `Remove-Item`) sin escribirlo en el reporte.
8. **Push solo a `master`** (Vercel despliega desde `master`). No toques `main` ni subas ramas que el prompt no pida.
