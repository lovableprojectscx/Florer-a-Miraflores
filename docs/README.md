# Documentación técnica — Florería Miraflores

Índice de toda la documentación técnica del proyecto. Cada documento refleja **lo que el código realmente implementa** (verificado sobre `src/`), con las divergencias respecto al `CLAUDE.md` marcadas con ⚠️.

| Documento | Contenido |
| --- | --- |
| [REQUISITOS-FUNCIONALES.md](./REQUISITOS-FUNCIONALES.md) | Requisitos funcionales (RF) y no funcionales (RNF) con ID, prioridad, estado y trazabilidad. Matriz base para el análisis. |
| [ARQUITECTURA.md](./ARQUITECTURA.md) | Stack real, diagramas (sistema, datos, checkout), estructura de carpetas, capas y deuda técnica. |
| [BASE-DE-DATOS.md](./BASE-DE-DATOS.md) | Configuración de Supabase: tablas, columnas, RLS, extensiones y datos seed. |

### Documentos relacionados (fuera de `docs/`)

| Ubicación | Contenido |
| --- | --- |
| `../CLAUDE.md` | Especificación original / peticiones del proyecto (fuente de los requisitos). |
| `../brand/README.md` | Guía de identidad visual: logo, paleta y tipografía. |
| `../brand/logo/` | Logo vectorial (SVG) y variantes. |
| `../brand/tokens.css` | Tokens de diseño. |

---

## Estado del proyecto (resumen)

- ✅ **Completado:** catálogo con filtros, producto, carrito, checkout con delivery por distritos, confirmación, panel admin completo, Supabase + RLS.
- ⚠️ **Parcial / por auditar:** estados del pedido (falta "En preparación"), SEO, lazy-load de imágenes.
- ❌ **Pendiente (bloqueante):** integración IZIPay (credenciales de Sofía) y notificación por correo.

Ver el detalle en [REQUISITOS-FUNCIONALES.md § 12](./REQUISITOS-FUNCIONALES.md#12-resumen-para-el-análisis).

> Próximo paso previsto: implementar correo automático y estado "En preparación" (no dependen de terceros), y luego IZIPay cuando lleguen las credenciales. Esto servirá para cerrar el análisis de cumplimiento.
