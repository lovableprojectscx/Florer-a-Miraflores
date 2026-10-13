# Documentación técnica — Florería Miraflores

Índice de toda la documentación técnica del proyecto. Cada documento refleja **lo que el código realmente implementa** (verificado sobre `src/`), con las divergencias respecto al `CLAUDE.md` marcadas con ⚠️.

| Documento                                                            | Contenido                                                                                                                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ACTUALIZACIONES.md](./ACTUALIZACIONES.md)                           | **Historial cronológico de cambios técnicos:** Registro detallado de versiones (v1.0.1 a v1.9.0), requerimientos resueltos, archivos modificados y decisiones de arquitectura. |
| [CERTIFICACION-LANZAMIENTO.md](./CERTIFICACION-LANZAMIENTO.md)       | **Acta oficial de certificación:** Veredicto GO con condiciones, resultados de auditorías técnicas (Lighthouse, E2E, RLS, imágenes) y pendientes administrativos de Jack.      |
| [CHECKLIST-MANUAL-LANZAMIENTO.md](./CHECKLIST-MANUAL-LANZAMIENTO.md) | **Checklist manual pre-lanzamiento:** Verificaciones visuales en dispositivos reales, pasarela y operaciones para el equipo.                                                   |
| [SEGURIDAD.md](./SEGURIDAD.md)                                       | **Seguridad y RLS:** Endurecimiento de permisos admin con `is_admin()`, gestión de usuarios y análisis de riesgo de montos en checkout.                                        |
| [REQUISITOS-FUNCIONALES.md](./REQUISITOS-FUNCIONALES.md)             | Requisitos funcionales (RF) y no funcionales (RNF) con ID, prioridad, estado y trazabilidad. Matriz base para el análisis.                                                     |
| [ARQUITECTURA.md](./ARQUITECTURA.md)                                 | Stack real (TanStack Start + React 19), diagramas de arquitectura y flujo de datos, estructura de carpetas, capas y módulos.                                                   |
| [BASE-DE-DATOS.md](./BASE-DE-DATOS.md)                               | Configuración de Supabase: esquemas de tablas, RLS, extensiones, relaciones y políticas de Storage.                                                                            |
| [INCIDENCIAS-Y-SOLUCIONES.md](./INCIDENCIAS-Y-SOLUCIONES.md)         | Informe técnico de problemas detectados en desarrollo (tags, persistencia visual en admin) y sus soluciones.                                                                   |
| [TESTING.md](./TESTING.md)                                           | Guía de pruebas automatizadas (Vitest unitario, Vitest RLS y Playwright E2E mobile/desktop) y regla de protección de datos de producción.                                      |
| [DIAGNOSTICO-CATEGORIAS.md](./DIAGNOSTICO-CATEGORIAS.md)             | Diagnóstico de solo lectura sobre la jerarquía de categorías, conteo de productos, causas de los 3 reclamos de categorías y matriz de decisiones D1/D2.                        |
| [PLAN-DE-TRABAJO.md](./PLAN-DE-TRABAJO.md)                           | Backlog priorizado de mejoras y pendientes antes y después del lanzamiento.                                                                                                    |

### Documentos relacionados (fuera de `docs/`)

| Ubicación             | Contenido                                                                     |
| --------------------- | ----------------------------------------------------------------------------- |
| `../CLAUDE.md`        | Especificación original / peticiones del proyecto (fuente de los requisitos). |
| `../brand/README.md`  | Guía de identidad visual: logo, paleta y tipografía.                          |
| `../brand/logo/`      | Logo vectorial (SVG) y variantes de isotipo.                                  |
| `../brand/tokens.css` | Tokens de diseño corporativos.                                                |

---

## Estado del proyecto (resumen a Octubre 2026)

- ✅ **Completado y certificado (Fases 01 a 06):** Catálogo enriquecido con paginación "Ver más" (lotes de 24) y fotos 4:5; RLS blindado con `is_admin()`; estado de pedidos "En preparación" certificado; checkout seguro con hora de Lima y deduplicación de números de pedido; acciones rápidas en Home (RF-017 / RF-018); 412 imágenes validadas (0 rotas); sitemap.xml (437 URLs) y robots.txt; `<html lang="es">`; suite completa de 71 unit tests y 50 tests E2E en verde.
- 📋 **Veredicto pre-lanzamiento:** `GO con condiciones` (5 tareas administrativas de Jack detalladas en `CERTIFICACION-LANZAMIENTO.md`).
- ❌ **Pendiente externo (post-lanzamiento):** Integración pasarela IZIPay (en espera de credenciales de Sofía) y servicio de correo transaccional.

Ver el detalle en [CERTIFICACION-LANZAMIENTO.md](./CERTIFICACION-LANZAMIENTO.md) y el historial en [ACTUALIZACIONES.md](./ACTUALIZACIONES.md).
