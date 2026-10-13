# Acta de Certificación Pre-Lanzamiento — Florería Miraflores

**Fecha:** 13 de Octubre de 2026  
**Rama certificada:** `fase-06-certificacion`  
**Commit base:** `6bcce53` (master tras Fase 05)  
**Ambiente de auditoría:** Build local de producción (`npm run build` + `npm run preview` en `http://127.0.0.1:4173/`) conectado a Supabase Producción (`sdrkiomeesoctsxeidmu` en solo lectura / anon key)

---

## Veredicto Oficial

# VEREDICTO: GO con condiciones

La plataforma cumple con todos los criterios de estabilidad, seguridad, cobertura de pruebas, ausencia de desbordamiento responsivo y rendimiento técnico para su puesta en marcha pública comercial. El despliegue final está condicionado a la ejecución de las 5 acciones administrativas pendientes a cargo de Jack especificadas en este documento.

---

## 1. Resumen de Pruebas y Evidencias Técnicas

| Prueba / Auditoría           | Comando / Métrica                     | Resultado                                                                  | Archivo de Evidencia                                                                   |
| :--------------------------- | :------------------------------------ | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Pipeline de Verificación** | `npm run verify`                      | ✅ 0 errores ESLint, TypeScript limpio, 71 unit tests, build exitoso       | [`docs/evidencias/fase-06/verify.txt`](file:///docs/evidencias/fase-06/verify.txt)     |
| **Cobertura de Código**      | `npm run test:coverage`               | ✅ `src/lib`: 94.6% líneas, `src/hooks`: 100%, `src/store`: 100%           | [`docs/evidencias/fase-06/coverage.txt`](file:///docs/evidencias/fase-06/coverage.txt) |
| **Seguridad de Datos (RLS)** | `npm run test:rls`                    | ✅ 10/10 tests pasados con anon key (escrituras no autorizadas bloqueadas) | [`docs/evidencias/fase-06/rls.txt`](file:///docs/evidencias/fase-06/rls.txt)           |
| **Pruebas End-to-End (E2E)** | `npx playwright test`                 | ✅ 50 pasados, 2 skipped controlados (0 fallos en mobile y desktop)        | [`docs/evidencias/fase-06/e2e.txt`](file:///docs/evidencias/fase-06/e2e.txt)           |
| **Auditoría de Imágenes**    | `node scripts/verificar-imagenes.mjs` | ✅ 412 URLs únicas auditadas, 412 válidas (100%), 0 rotas                  | [`docs/evidencias/fase-06/imagenes.md`](file:///docs/evidencias/fase-06/imagenes.md)   |
| **Sitemap XML**              | `node scripts/generate-sitemap.mjs`   | ✅ 437 URLs indexables generadas                                           | [`public/sitemap.xml`](file:///public/sitemap.xml)                                     |
| **Robots.txt**               | Configuración de indexación           | ✅ Rutas públicas abiertas, `/admin` y `/confirmacion` bloqueadas          | [`public/robots.txt`](file:///public/robots.txt)                                       |

---

## 2. Auditoría Lighthouse Móvil (Build de Producción)

Auditoría realizada mediante Lighthouse CLI v12.8.2 en modo móvil con estrangulamiento estándar sobre el build compilado de producción local:

| Ruta Auditada                        | Performance | Accessibility | Best Practices | SEO | Reportes Generados                                                                                                                                                                   |
| :----------------------------------- | :---------: | :-----------: | :------------: | :-: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home (`/`)**                       |     58      |      89       |      100       | 100 | [`home.report.html`](file:///docs/evidencias/fase-06/lighthouse/home.report.html), [`home.report.json`](file:///docs/evidencias/fase-06/lighthouse/home.report.json)                 |
| **Catálogo (`/catalogo`)**           |     64      |      95       |      100       | 100 | [`catalogo.report.html`](file:///docs/evidencias/fase-06/lighthouse/catalogo.report.html), [`catalogo.report.json`](file:///docs/evidencias/fase-06/lighthouse/catalogo.report.json) |
| **Ficha Producto (`/producto/:id`)** |     73      |      96       |      100       | 100 | [`producto.report.html`](file:///docs/evidencias/fase-06/lighthouse/producto.report.html), [`producto.report.json`](file:///docs/evidencias/fase-06/lighthouse/producto.report.json) |

**Aspectos destacados de SEO y A11y:**

- Idioma base fijado a español (`<html lang="es">`).
- Metadatos OpenGraph, títulos diferenciados y meta descriptions en todas las rutas.
- Máxima puntuación (100/100) en Prácticas Recomendadas y SEO en todas las páginas clave.

---

## 3. Auditoría de Seguridad y Secretos

1. **Escaneo de Bundle (`dist/`)**:
   - Búsqueda exhaustiva de patrones sensibles (`service_role`, `sbp_`, `sk_live`, llaves privadas).
   - Resultado: 0 credenciales secretas expuestas en el código cliente o servidor compilado.
2. **Archivos de Entorno (`.env`)**:
   - `git ls-files` confirma que 0 archivos `.env`, `.env.local` o `.env.e2e.local` están rastreados en git.
   - `.gitignore` protege adecuadamente `.env` y `.env.*`.
3. **Logs en Código Fuente (`src/`)**:
   - Búsqueda de `console.log` en `src/`: 0 coincidencias en todo el código de producción.

---

## 4. Condiciones para el Lanzamiento (Pendientes de Jack)

Para completar la transición al ambiente productivo público, Jack debe realizar las siguientes 5 tareas en el panel de control y repositorio:

1. **Push a GitHub**:
   - Realizar `git push origin master` una vez integrada la fase certificada (el entorno local tiene el push remoto bloqueado).
2. **Eliminar Usuario Temporal de Autenticación**:
   - Entrar al panel de Supabase (_Authentication > Users_) y eliminar permanentemente la cuenta de prueba `test_admin_temp@floreriamiraflores.com`.
3. **Desactivar Registro Público de Usuarios**:
   - En Supabase (_Authentication > Providers > Email_), desmarcar la casilla _"Allow new users to sign up"_ para impedir registros no autorizados.
4. **Reparto de Productos en Nacimientos**:
   - En el panel administrativo (`/admin/productos`), asignar productos reales a las subcategorías _Nacimientos Niño_ y _Nacimientos Niña_ para activarlas en el catálogo.
5. **Aprobación y Aplicación de Reasignación de Tulipanes (SQL 004)**:
   - Revisar la tabla de 13 productos en `docs/sql/004-tulipanes-reasignacion.sql` y autorizar su ejecución cuando se desee reorganizar dicha categoría.
