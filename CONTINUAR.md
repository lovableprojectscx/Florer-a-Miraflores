# CONTINUAR — Punto de arranque para un chat/sesión nuevo

> Pega esto como primer mensaje en el chat nuevo (o deja que lo lea): es la continuación del trabajo. La conversación anterior NO viaja, pero TODO el contexto está en archivos.

## Instrucción para el asistente nuevo

Antes de responder nada, **lee en este orden** y confirma que entendiste:

1. `spec-kit/constitution.md` — reglas no negociables y cómo trabajar.
2. `spec-kit/spec.md` — qué es el producto y qué hace.
3. `spec-kit/plan.md` — stack real y arquitectura.
4. `spec-kit/tasks.md` — qué sigue, priorizado.
5. `CLAUDE.md` — especificación completa (fuente de verdad, con divergencias marcadas).
6. `docs/PLAN-DE-TRABAJO.md` — backlog detallado con notas.

Para imágenes/banners con IA: `brand/PROMPT-MAESTRO-FOTOS.md` y `brand/PROMPT-MAESTRO-BANNERS.md`.
Para marca/logo: `brand/README.md`, `brand/logo/`, `brand/tokens.css`.

## Contexto mínimo (por si solo lees esto)

- Proyecto: **Florería Miraflores**, e-commerce de flores en Lima. React 19 + TanStack Start + Supabase, deploy Vercel. ~300 productos cargados, preparando lanzamiento.
- Dueño: Jack (IDENZA). Responde en español, tono cercano ("mi pana"), honesto, distinguiendo código vs config vs bloqueado.
- Estado: catálogo, carrito, checkout con delivery y panel admin ✅. Pendiente bloqueante: IZIPay (credenciales) y correo automático.

## Lo que sigue (de `spec-kit/tasks.md`)

**P1 antes de lanzar:** paginación del catálogo, fotos más grandes (estilo Lima Floral), arreglar categorías (Nacimientos / dividir niño-niña / Tulipanes), estado "En preparación".

## Cómo lo abriste (recordatorio para Jack)

Chat nuevo en Cowork → misma carpeta conectada (`floreria-miraflo-main`) → cambia el modelo si quieres → pega:

> Lee `CONTINUAR.md` y sigue las instrucciones de ahí. Cuando termines de leer el contexto, dime por dónde seguimos.

## Flujo de trabajo acordado (desde 12-10-2026)

1. Jack pega en Antigravity el Prompt 00 + el prompt de la fase (`prompts-antigravity/` o el mapa de lanzamiento).
2. Antigravity trabaja en su rama `fase-XX-...` y entrega el reporte (formato del Prompt 00, con salida real de tests).
3. Jack le pasa el reporte a Claude. **Claude es el revisor**: verifica contra el código real (git, solo lectura) y responde APROBADO u OBSERVADO con prompt de corrección.
4. SQL: Antigravity lo escribe y lo ejecuta por MCP solo después de "SQL NNN aprobado por el revisor". Si el SQL cambia después de aprobado, se detiene y lo vuelve a mostrar. En lo crítico, pedir salida CRUDA del MCP.
5. Merge solo con APROBADO.

## Estado al 13-10-2026 (Fase 06-B — Rendimiento e Imágenes Livianas Completada)

- APROBADAS y mergeadas en master local:
  - Fase 01: Base de pruebas automatizadas (`npm run verify`).
  - Fase 02: Diagnóstico de categorías en solo lectura.
  - Fase 03: Arreglo de categorías (`docs/sql/003-nacimientos-padre.sql` aplicado).
  - Fase 03-B: Seguridad RLS (`docs/sql/005-admin-rls.sql` aplicado, admin único: `pedidos@floreriamiraflores.com`).
  - Fase 04: Catálogo (fotos 4:5 + paginación incremental "Ver más" de 24).
  - Fase 05: Pedidos / checkout (`docs/sql/006-pedidos-estado-check.sql` aplicado, hora de Lima en checkout, deduplicación de número de pedido).
  - Fase 06: Certificación pre-lanzamiento (cobertura E2E, sitemap, robots.txt, 0 overflow).
  - Fase 06-B: **Imágenes livianas y rendimiento móvil**:
    - Generación y subida de 992 miniaturas WebP (480w y 960w) cubriendo el 100% de las 496 imágenes originales en Supabase Storage (script autenticado como admin, sin service role key, `upsert: false`).
    - Verificación completa con 50/50 peticiones HTTP HEAD en 200 OK.
    - Componente unificado `<ResponsiveImage>` con fallback robusto que retira `srcset`/`sizes` ante errores y prueba E2E en Playwright con bloqueo 404 (`6 passed`).
    - Carrusel de Novedades del Home en proporción 4:5 con tarjetas grandes (45% en móvil).
    - Preconnect a Supabase en `<head>` de `__root.tsx`.
    - Reducción del Home de 14.0 MB a 1.70 MB (-87.8%), LCP móvil de 40 s a 5.1 s local, Accesibilidad 96/100, Best Practices 100/100, SEO 100/100.
    - Veredicto en `docs/CERTIFICACION-LANZAMIENTO.md`: **GO condicionado**.

- Pendientes asignados a Jack antes del despliegue:
  1. Push a GitHub (`git push origin master`) para disparar el build productivo de Vercel.
  2. Medir Lighthouse sobre la URL de Vercel tras el push (verificar compresión Brotli y CDN Edge).
  3. Revisión / eliminación de pedidos de prueba (`FM-TEST01`, etc.) en la tabla `pedidos` de producción.
  4. Borrar `test_admin_temp@floreriamiraflores.com` en Supabase Auth (*Authentication > Users*).
  5. Desactivar "Allow new users to sign up" en Supabase Auth (*Authentication > Providers > Email*).
  6. Repartir productos en Nacimientos Niño/Niña en el panel administrativo.
  7. Confirmar tabla de Tulipanes (`docs/sql/004-tulipanes-reasignacion.sql`).
