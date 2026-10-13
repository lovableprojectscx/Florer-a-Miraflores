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

## Estado al 12-10-2026 (noche)

- APROBADAS y mergeadas en master local: Fase 01 (tests), 02 (diagnóstico), 03 (categorías + SQL 003 ejecutado), 03-B (seguridad RLS, SQL 005 ejecutado: solo pedidos@floreriamiraflores.com es admin), 04 (catálogo fotos 4:5 + "Ver más"). Último merge: c3e377b.
- SIGUIENTE: Fase 05 (pedidos/checkout). Prompt 05 + ajustes: el CHECK de estado lo verifica Antigravity por MCP; riesgo de montos va en docs/SEGURIDAD.md; no crear pedidos reales.
- Pendientes de Jack: borrar test_admin_temp en Supabase Auth; desactivar "Allow new users to sign up"; push bloqueado (credencial jackquispe27-source sin permiso en lovableprojectscx/Florer-a-Miraflores); confirmar rama de Vercel; la encargada reparte los 39 productos en Niño/Niña y confirma la tabla de 13 de Tulipanes (luego "SQL 004 aprobado").
- La landing (Novedades.tsx) NO cambió en la Fase 04: sus tarjetas siguen chicas (slider 160–260 px, foto cuadrada). Pendiente decidir si se agrandan.
