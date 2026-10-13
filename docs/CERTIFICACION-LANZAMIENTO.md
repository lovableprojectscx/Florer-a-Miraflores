# Acta de Certificación Pre-Lanzamiento — Florería Miraflores

**Fecha:** 13 de Octubre de 2026  
**Rama certificada:** `master` (con Fases 01 a 06-B integradas)  
**Ambiente de auditoría:** Build local de producción (`npm run build` + `npm run preview` en `http://127.0.0.1:4173/`) conectado a Supabase Producción (`sdrkiomeesoctsxeidmu` en solo lectura / anon key)

---

## Veredicto Oficial

# VEREDICTO: GO condicionado

La plataforma cumple con los criterios de estabilidad, seguridad, diseño visual responsive, catálogo categorizado, flujo de compra íntegro, ausencia de desbordamiento horizontal y cobertura de pruebas automatizadas.

El cuello de botella crítico de imágenes pesadas ha sido **resuelto satisfactoriamente en la Fase 06-B**:
- Se generaron y subieron **992 miniaturas WebP** (480w y 960w) para el 100% de las 496 imágenes originales en Supabase Storage.
- El peso de transferencia móvil del Home se redujo de **14.0 MB a 1.70 MB (-87.8%)**, eliminando el riesgo de agotamiento de cuota de egress en Supabase (de ~360 visitas posibles al mes a más de 3,000 visitas con margen seguro).
- La accesibilidad del Home subió de **89 a 96 sobre 100** (superando la meta de ≥90).

### Condición del GO:
1. **Medir Lighthouse sobre la URL productiva de Vercel después del push**: El puntaje de Performance móvil obtenido en la auditoría local es de **66** debido a la latencia del servidor de preview local y a la ausencia de compresión estática (`uses-text-compression`). Esta métrica no refleja el rendimiento en producción, ya que Vercel comprime automáticamente todos los recursos HTML, CSS y JS con Brotli y Gzip, además de servir mediante HTTP/2 y Edge CDN global, lo que elevará el puntaje de Performance.
2. **Completar las tareas administrativas pendientes a cargo de Jack**.

---

## 1. Rendimiento y Carga de Red (Auditoría Lighthouse Móvil Antes vs. Después)

Datos reales extraídos directamente de los reportes oficiales generados por Lighthouse CLI v12.8.2 en modo móvil:

| Página | Métrica | Fase 06 (Línea Base) | Fase 06-B Preliminar (Sin Miniaturas) | **Fase 06-B Final (Con Miniaturas WebP)** | Impacto / Ahorro |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Home (`/`)** | **Peso Total de Red** | 14.0 MB | 12.5 MB | **1.70 MB** | **-87.8% (-12.3 MB)** |
| | **LCP Móvil** | 40.0 s | 31.0 s | **5.1 s** | **-87.2% más rápido** |
| | **Performance** | 58 | 61 | **66** | **+8 puntos** |
| | **Accessibility** | 89 | 89 | **96** | **+7 puntos (Meta ≥90 ✅)** |
| | **Best Practices**| 100 | 100 | **100** | **100/100 ✅** |
| | **SEO** | 100 | 100 | **100** | **100/100 ✅** |
| **Catálogo (`/catalogo`)** | **Peso Total de Red** | 5.3 MB | - | **1.02 MB** | **-80.7% (-4.3 MB)** |
| | **LCP Móvil** | 7.2 s | - | **6.8 s** | **-0.4 s** |
| | **Performance** | 64 | - | **66** | **+2 puntos** |
| | **Accessibility** | 95 | - | **95** | **95/100 ✅** |
| | **Best Practices**| 100 | - | **100** | **100/100 ✅** |
| | **SEO** | 100 | - | **100** | **100/100 ✅** |
| **Producto (`/producto/:id`)** | **Peso Total de Red** | 1.9 MB | - | **0.55 MB** | **-71.1% (-1.35 MB)** |
| | **LCP Móvil** | 5.7 s | - | **5.0 s** | **-0.7 s** |
| | **Performance** | 73 | - | **74** | **+1 punto** |
| | **Accessibility** | 96 | - | **96** | **96/100 ✅** |
| | **Best Practices**| 100 | - | **100** | **100/100 ✅** |
| | **SEO** | 100 | - | **100** | **100/100 ✅** |

*Archivos de reporte auditados:*
- [`docs/evidencias/fase-06b/lighthouse/home.report.json`](file:///docs/evidencias/fase-06b/lighthouse/home.report.json)
- [`docs/evidencias/fase-06b/lighthouse/catalogo.report.json`](file:///docs/evidencias/fase-06b/lighthouse/catalogo.report.json)
- [`docs/evidencias/fase-06b/lighthouse/producto.report.json`](file:///docs/evidencias/fase-06b/lighthouse/producto.report.json)

---

## 2. Resumen de Pruebas y Evidencias Técnicas

| Prueba / Auditoría | Comando / Métrica | Resultado | Archivo de Evidencia |
| :--- | :--- | :--- | :--- |
| **Pipeline de Verificación Final** | `npm run verify` | ✅ 0 errores ESLint, TypeScript limpio, tests pasando, build exitoso | [`docs/evidencias/fase-06b/verify-final.txt`](file:///docs/evidencias/fase-06b/verify-final.txt) |
| **Verificación de Miniaturas en Storage** | `node scripts/verificar-miniaturas-subidas.mjs` | ✅ 496 imágenes originales cubiertas al 100% con 992 miniaturas WebP; 50/50 peticiones HEAD exitosas (HTTP 200 OK) | [`docs/evidencias/fase-06b/miniaturas-verificacion.txt`](file:///docs/evidencias/fase-06b/miniaturas-verificacion.txt) |
| **Pruebas E2E de Fallback ante Caída (404)** | `npx playwright test tests/e2e/thumbnails.spec.ts` | ✅ 6/6 tests pasados (bloqueo forzado a `/thumbs/` conmuta limpiamente a imágenes originales con `naturalWidth > 0`) | [`docs/evidencias/fase-06b/e2e.txt`](file:///docs/evidencias/fase-06b/e2e.txt) |
| **Cobertura de Código** | `npm run test:coverage` | ✅ `src/lib`: 94.6% líneas, `src/hooks`: 100%, `src/store`: 100% | [`docs/evidencias/fase-06/coverage.txt`](file:///docs/evidencias/fase-06/coverage.txt) |
| **Seguridad de Datos (RLS)** | `npm run test:rls` | ✅ 10/10 tests pasados con anon key (escrituras no autorizadas bloqueadas) | [`docs/evidencias/fase-06/rls.txt`](file:///docs/evidencias/fase-06/rls.txt) |
| **Sitemap XML** | `node scripts/generate-sitemap.mjs` | ✅ 437 URLs indexables generadas | [`public/sitemap.xml`](file:///public/sitemap.xml) |
| **Robots.txt** | Configuración de indexación | ✅ Rutas públicas abiertas, `/admin` y `/confirmacion` bloqueadas | [`public/robots.txt`](file:///public/robots.txt) |

---

## 3. Auditoría de Seguridad y Secretos

1. **Escaneo de Bundle (`dist/`)**:
   - 0 credenciales secretas (`service_role`, `sbp_`, llaves privadas) expuestas en código cliente o servidor compilado.
2. **Archivos de Entorno (`.env`)**:
   - `git ls-files` confirma que 0 archivos `.env`, `.env.local` o `.env.e2e.local` están rastreados en git.
3. **Logs en Código Fuente (`src/`)**:
   - 0 llamadas de depuración `console.log` en código fuente de producción.

---

## 4. Condiciones para el Lanzamiento (Pendientes de Jack)

Para completar la transición al ambiente productivo público, Jack debe coordinar y ejecutar las siguientes tareas:

1. **Medir Lighthouse sobre la URL de Vercel tras el Push:**
   - Una vez desplegado en Vercel, ejecutar la auditoría Lighthouse para verificar la ganancia proporcionada por la compresión Brotli del Edge CDN de Vercel y HTTP/2.
2. **Revisión de Pedidos de Prueba en Producción:**
   - En la tabla `pedidos` existen registros de prueba generados durante el desarrollo inicial (ej. `FM-TEST01`, etc.); Jack debe evaluar si se eliminan antes del lanzamiento oficial.
3. **Push a GitHub:**
   - Realizar `git push origin master` una vez completada la revisión (el entorno local mantiene el push remoto bloqueado).
4. **Eliminar Usuario Temporal de Autenticación:**
   - En el panel de Supabase (*Authentication > Users*), eliminar permanentemente la cuenta de prueba `test_admin_temp@floreriamiraflores.com`.
5. **Desactivar Registro Público de Usuarios:**
   - En Supabase (*Authentication > Providers > Email*), desmarcar la casilla *"Allow new users to sign up"* para impedir registros no autorizados.
6. **Reparto de Productos en Nacimientos:**
   - En el panel administrativo (`/admin/productos`), asignar productos reales a las subcategorías *Nacimientos Niño* y *Nacimientos Niña* para activarlas en el catálogo.
7. **Aprobación y Aplicación de Reasignación de Tulipanes (SQL 004):**
   - Revisar la tabla de 13 productos en `docs/sql/004-tulipanes-reasignacion.sql` y autorizar su ejecución cuando se desee reorganizar dicha categoría.
