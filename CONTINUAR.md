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
