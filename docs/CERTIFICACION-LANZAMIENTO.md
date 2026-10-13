# Acta de Certificación Pre-Lanzamiento — Florería Miraflores

**Fecha:** 13 de Octubre de 2026  
**Rama certificada:** `fase-06-certificacion`  
**Commit base:** `6bcce53` (master tras Fase 05)  
**Ambiente de auditoría:** Build local de producción (`npm run build` + `npm run preview` en `http://127.0.0.1:4173/`) conectado a Supabase Producción (`sdrkiomeesoctsxeidmu` en solo lectura / anon key)

---

## Veredicto Oficial

# VEREDICTO: NO-GO hasta completar la Fase 06-B (imágenes)

La plataforma cumple con los criterios de estabilidad, seguridad, ausencia de desbordamiento horizontal y cobertura de pruebas automatizadas. Sin embargo, el veredicto es **NO-GO** debido al peso excesivo de imágenes en el Home (14 MB) y un LCP móvil elevado (40 s), lo que representa un riesgo crítico de agotamiento de cuota de transferencia saliente (egress) en Supabase y una experiencia lenta en conexiones móviles. El pase a producción queda postergado hasta completar la **Fase 06-B (imágenes livianas + fotos grandes en el home)** y cumplir las acciones administrativas pendientes de Jack.

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

## 2. Rendimiento y Carga de Red (Auditoría Lighthouse Móvil)

Auditoría realizada mediante Lighthouse CLI v12.8.2 en modo móvil con estrangulamiento estándar sobre el build compilado de producción local:

| Ruta Auditada                        | Peso Total |    LCP     | Performance | Accessibility | Best Practices | SEO | Reportes Generados                                                                                                                                                                   |
| :----------------------------------- | :--------: | :--------: | :---------: | :-----------: | :------------: | :-: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home (`/`)**                       | **14 MB**  | **40.0 s** |     58      | 89 (meta ≥90) |      100       | 100 | [`home.report.html`](file:///docs/evidencias/fase-06/lighthouse/home.report.html), [`home.report.json`](file:///docs/evidencias/fase-06/lighthouse/home.report.json)                 |
| **Catálogo (`/catalogo`)**           |   5.3 MB   |   7.2 s    |     64      |      95       |      100       | 100 | [`catalogo.report.html`](file:///docs/evidencias/fase-06/lighthouse/catalogo.report.html), [`catalogo.report.json`](file:///docs/evidencias/fase-06/lighthouse/catalogo.report.json) |
| **Ficha Producto (`/producto/:id`)** |   1.9 MB   |   5.7 s    |     73      |      96       |      100       | 100 | [`producto.report.html`](file:///docs/evidencias/fase-06/lighthouse/producto.report.html), [`producto.report.json`](file:///docs/evidencias/fase-06/lighthouse/producto.report.json) |

### Diagnóstico Técnico de Rendimiento

1. **Causa principal (imágenes no responsivas):**
   - La auditoría `uses-responsive-images` reporta un desperdicio directo de **12.7 MB (~13 MB)** en el Home. Se descargan imágenes originales completas para renderizarlas en tarjetas de 160–260 px en móvil y escritorio.
2. **Nota sobre compresión de texto:**
   - La advertencia de `uses-text-compression` observada en el test local ocurre porque `vite preview` no comprime texto. En Vercel producción, el edge CDN comprime HTML, JS y CSS automáticamente con Brotli y Gzip, por lo que no es un problema de la aplicación.
3. **Riesgo crítico de transferencia (Egress en Supabase Free):**
   - El plan gratuito de Supabase incluye un límite de ancho de banda saliente de aproximadamente **5 GB mensuales**.
   - Con el Home pesando 14 MB por visita, **la cuota mensual se agotaría con apenas ~360 visitas**, bloqueando el acceso a las imágenes de la tienda.
   - En la Fase 06-B es indispensable reducir el payload del Home a **menos de 2.5 MB** mediante generación y consumo de miniaturas responsivas (WebP 480 px y 960 px).

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

Para completar la transición al ambiente productivo público, Jack debe coordinar y ejecutar las siguientes tareas:

1. **Aprobación de la Fase 06-B (Optimización de Imágenes):**
   - Ejecutar la generación de miniaturas e implementación de `srcset`/`sizes` para reducir el Home a <2.5 MB y LCP <4 s.
2. **Revisión de Pedidos de Prueba en Producción:**
   - En la tabla `pedidos` existen filas de prueba generadas en el desarrollo inicial (ej. `FM-TEST01`, etc.); Jack debe evaluar si se eliminan antes del lanzamiento oficial.
3. **Push a GitHub:**
   - Realizar `git push origin master` una vez que todas las fases previas estén aprobadas y mergeadas (el entorno local mantiene el push remoto bloqueado).
4. **Eliminar Usuario Temporal de Autenticación:**
   - Entrar al panel de Supabase (_Authentication > Users_) y eliminar permanentemente la cuenta de prueba `test_admin_temp@floreriamiraflores.com`.
5. **Desactivar Registro Público de Usuarios:**
   - En Supabase (_Authentication > Providers > Email_), desmarcar la casilla _"Allow new users to sign up"_ para impedir registros no autorizados.
6. **Reparto de Productos en Nacimientos:**
   - En el panel administrativo (`/admin/productos`), asignar productos reales a las subcategorías _Nacimientos Niño_ y _Nacimientos Niña_ para activarlas en el catálogo.
7. **Aprobación y Aplicación de Reasignación de Tulipanes (SQL 004):**
   - Revisar la tabla de 13 productos en `docs/sql/004-tulipanes-reasignacion.sql` y autorizar su ejecución cuando se desee reorganizar dicha categoría.
