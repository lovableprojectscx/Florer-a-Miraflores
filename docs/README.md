# Documentación técnica — Florería Miraflores

Índice de toda la documentación técnica del proyecto. Cada documento refleja **lo que el código realmente implementa** (verificado sobre `src/`), con las divergencias respecto al `CLAUDE.md` marcadas con ⚠️.

| Documento | Contenido |
| --- | --- |
| [ACTUALIZACIONES.md](./ACTUALIZACIONES.md) | **Historial cronológico de cambios técnicos:** Registro detallado de versiones (v1.0.1 a v1.4.0), requerimientos resueltos, archivos modificados y decisiones de arquitectura. |
| [REQUISITOS-FUNCIONALES.md](./REQUISITOS-FUNCIONALES.md) | Requisitos funcionales (RF) y no funcionales (RNF) con ID, prioridad, estado y trazabilidad. Matriz base para el análisis. |
| [ARQUITECTURA.md](./ARQUITECTURA.md) | Stack real (TanStack Start + React 19), diagramas de arquitectura y flujo de datos, estructura de carpetas, capas y módulos. |
| [BASE-DE-DATOS.md](./BASE-DE-DATOS.md) | Configuración de Supabase: esquemas de tablas, RLS, extensiones, relaciones y políticas de Storage. |
| [INCIDENCIAS-Y-SOLUCIONES.md](./INCIDENCIAS-Y-SOLUCIONES.md) | Informe técnico de problemas detectados en desarrollo (tags, persistencia visual en admin) y sus soluciones. |

### Documentos relacionados (fuera de `docs/`)

| Ubicación | Contenido |
| --- | --- |
| `../CLAUDE.md` | Especificación original / peticiones del proyecto (fuente de los requisitos). |
| `../brand/README.md` | Guía de identidad visual: logo, paleta y tipografía. |
| `../brand/logo/` | Logo vectorial (SVG) y variantes de isotipo. |
| `../brand/tokens.css` | Tokens de diseño corporativos. |

---

## Estado del proyecto (resumen a Octubre 2026)

- ✅ **Completado y en producción:** Catálogo enriquecido con filtros de subcategorías, página de producto con galería adaptativa, carrito reactivo (Zustand), checkout con cálculo dinámico de delivery, confirmación con enlace a WhatsApp, página dedicada `/nosotros`, diseño Bento Collage en Home, header con desplazamiento natural (scroll no estático), calibración para pantallas de laptops, panel administrativo integral (CRUD para 10 tablas), optimización WebP en Supabase Storage, mitigación de seguridad CVE-2026-102989.
- ⚠️ **Parcial / por auditar:** Estados del pedido (falta "En preparación"), SEO y Schema.org.
- ❌ **Pendiente (bloqueante externo):** Integración pasarela IZIPay (en espera de credenciales de Sofía) y servicio de correo transaccional.

Ver el detalle en [REQUISITOS-FUNCIONALES.md § 12](./REQUISITOS-FUNCIONALES.md#12-resumen-para-el-análisis) y el historial en [ACTUALIZACIONES.md](./ACTUALIZACIONES.md).
