# Constitution — Florería Miraflores

Principios y reglas no negociables del proyecto. Todo cambio debe respetarlos.

## Negocio

- E-commerce de flores y regalos para Lima: Miraflores, Surco, Barranco, Lince, San Isidro.
- Marca premium, femenina, elegante y cálida. Cliente final: personas que regalan flores (amor, cumpleaños, condolencias, etc.).
- Dueño del proyecto: Jack (IDENZA, consultoría de sistemas web). Clienta del negocio: Sofía. Hay una encargada de marketing que carga contenido.

## Reglas técnicas (no negociables)

1. **Seguridad primero:** RLS activado en todas las tablas de Supabase. Secrets (IZIPay, credenciales) SOLO en servidor / Edge Functions. NUNCA exponer API keys en el frontend.
2. **Carrito en Zustand**, en memoria del navegador, nunca en BD.
3. **Imágenes en Supabase Storage**, no en la BD. La BD solo guarda URLs y datos. Optimizar a WebP, usar `loading="lazy"`.
4. **IZIPay** se integra por Edge Functions con dos ambientes separados (Sandbox / Producción). No mezclar credenciales.
5. **Pedidos:** INSERT público (checkout), SELECT/UPDATE solo admin.
6. Respetar las convenciones de código del `CLAUDE.md` §18 (PascalCase componentes, `useNombre` hooks, async/await, feedback de errores con toast, sin `console.log` en producción).

## Divergencias conocidas (código real vs CLAUDE.md)

- Stack real: **TanStack Start + TanStack Router** (SSR-capable), NO el "SPA + React Router" que dice el CLAUDE.md §3.
- Identidad visual real: paleta marfil/blanco con **acento rosa `#C4848A`** y tipografía **DM Sans** — no el champagne + Cormorant del CLAUDE.md §4. (Decisión de marca pendiente de cerrar con Sofía. Ver `brand/README.md`.)
- Antes de tocar código, verificar en `src/` cómo está hecho de verdad; el CLAUDE.md tiene varias divergencias marcadas con ⚠️ en los docs.

## Cómo trabajar

- Responde en **español**, tono cercano (al dueño le dicen "mi pana").
- Sé **honesto** sobre lo viable; no prometas de más.
- Clasifica siempre cada pedido en: **código** (dev), **config/contenido** (panel admin) o **bloqueado** (depende de terceros).
- No bloquees el lanzamiento por cosas que pueden ir después (IZIPay, correo). El pago hoy se coordina por WhatsApp.
- Revisar siempre en **celular** antes de dar algo por bueno (ahí entra la mayoría de clientes).
