# PROMPT 08 — Correo automático al recibir un pedido (P2)

> Prometido en la cotización. Depende de terceros: cuenta en Resend y dominio verificado. Por eso la fase empieza revisando qué hay.

---

Rama: `fase-08-correo`.

## Antes de programar: qué necesita Jack

Lista en el reporte (y en `docs/CORREO.md`) lo que debe existir, y **detente** si falta algo bloqueante:

1. Cuenta en Resend y `RESEND_API_KEY`.
2. Dominio `floreriamiraflores.com` verificado en Resend (registros DNS SPF/DKIM). Sin esto los correos caen en spam o no salen; mientras tanto, solo se puede probar enviando desde el dominio de pruebas de Resend a la cuenta del propio Jack.
3. Correo remitente (p. ej. `pedidos@floreriamiraflores.com`) y correo que recibe el aviso interno.

## Diseño

- El envío ocurre **en servidor**, nunca desde el navegador, y la API key vive solo como variable de entorno del servidor. Usa una ruta de servidor de TanStack Start (desplegada en Vercel) o una Edge Function de Supabase; elige una, justifícala en `docs/CORREO.md` y sé consistente con lo que planea IZIPay (`CLAUDE.md` §10).
- Disparo: después de que `crearPedido` confirma el insert. El correo **no puede bloquear ni romper** el pedido: si falla, el pedido sigue registrado, se registra el error y el cliente igual ve la confirmación.
- Evita que cualquiera use tu endpoint para mandar correos: el servidor **busca el pedido por número en la BD** (con la service key, solo en servidor) y arma el correo con esos datos; nunca envía a un email ni contenido que venga del navegador. Limita a 1 envío por pedido (marca `correo_enviado_at` en `pedidos`, vía SQL en `docs/sql/`).
- Dos correos: al **cliente** (gracias, número FM-XXXXXX, resumen, entrega, total, WhatsApp) y aviso **interno** a la florería.
- Plantilla HTML simple, compatible con Gmail/Outlook móvil, con la marca (marfil, rosa `#C4848A`, logo de `brand/logo/`). Versión texto plano incluida.

## Tests

- Vitest: armado de la plantilla (incluye número, items, total; escapa HTML en nombres y notas); la ruta rechaza números inexistentes; no reenvía si ya hay `correo_enviado_at`; si Resend falla, no lanza hacia el checkout. Resend siempre mockeado.
- Playwright: el checkout llega a `/confirmacion` aunque el endpoint de correo responda 500 (interceptado).
- Prueba real **una sola vez**, con Jack presente, a su propio correo; adjunta captura del correo recibido en móvil.

## Documentación

`docs/CORREO.md` (configuración, variables en Vercel, cómo probar, qué hacer si no llegan), `docs/SEGURIDAD.md`, `docs/ACTUALIZACIONES.md`, `spec-kit/tasks.md`.

Entrega el reporte del Prompt 00.
