# Prompts para Antigravity — Florería Miraflores

Orden de uso. Cada fase en un chat (o en el mismo, si Antigravity mantiene contexto), siempre con el **00 primero**.

| #   | Prompt                                        | Tipo              | Depende de                                  | Para lanzar |
| --- | --------------------------------------------- | ----------------- | ------------------------------------------- | ----------- |
| 00  | Reglas y arranque                             | Contexto          | —                                           | Sí          |
| 01  | Base de pruebas (Vitest + Playwright + RLS)   | Código + tests    | 00                                          | Sí          |
| 02  | Diagnóstico de categorías (solo lectura)      | Investigación     | 01                                          | Sí          |
| 03  | Arreglo de categorías                         | Código + panel    | 02 + **tus decisiones D1/D2** + SQL corrido | Sí          |
| 04  | Catálogo: fotos grandes + "Ver más"           | Código + tests    | 01                                          | Sí          |
| 05  | Pedidos: "En preparación" + bugs del checkout | Código + SQL      | 01                                          | Sí          |
| 06  | Certificación pre-lanzamiento (GO/NO-GO)      | Pruebas + docs    | 03, 04, 05 mergeadas                        | Sí          |
| 07  | Reseñas y testimonios                         | Código + SQL      | 06                                          | No (P2)     |
| 08  | Correo automático                             | Código + terceros | 06 + cuenta Resend y dominio                | No (P2)     |

04 y 05 no dependen de 02/03: se pueden hacer mientras esperas el diagnóstico o la respuesta de Sofía.

IZIPay no tiene prompt todavía: está bloqueado hasta que lleguen las credenciales Sandbox.

## Flujo con cada fase

1. Pega 00 + el prompt de la fase.
2. Antigravity trabaja en su rama y entrega el **reporte** con evidencia.
3. Pásale el reporte a Claude para verificarlo contra el código antes de mergear.
4. Si hay SQL en `docs/sql/`, lo corres tú en Supabase → SQL Editor, y confirmas el resultado.
5. Merge y siguiente fase.

## Hallazgos que ya cambian el plan (verificados en el código el 12-10-2026)

- "En preparación" **ya está programado**; falta confirmar la BD (Fase 05).
- Los botones "Agregar" y "Compartir" del home (RF-017/018) **ya están programados** en `Novedades.tsx`; la matriz de requisitos está desactualizada (se certifican en la Fase 06).
- Bug: desde las 7 p. m. hora de Lima, el checkout no deja elegir entrega para mañana (Fase 05).
- El proyecto no tiene ningún test todavía (Fase 01).
- `CON FONDO HECHO 4K/` (~221 MB) no está en `.gitignore` (Fase 00/01).
- No existe `robots.txt` ni sitemap (Fase 06).
