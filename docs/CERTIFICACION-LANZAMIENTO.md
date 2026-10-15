# Acta de Certificación Pre-Lanzamiento — Florería Miraflores

**Fecha:** 13 de Octubre de 2026  
**Rama certificada:** `master` (desplegada y verificada en Vercel Producción)  
**URL de Producción (Vercel):** [`https://florer-a-miraflores.vercel.app/`](https://florer-a-miraflores.vercel.app/)  
**Ambiente de auditoría:** Despliegue oficial en Vercel Edge CDN con compresión Brotli/Gzip y HTTP/2, conectado a Supabase Producción (`sdrkiomeesoctsxeidmu`)

---

## Veredicto Oficial

# VEREDICTO: GO (Lanzamiento Autorizado)

La plataforma cumple con todos los estándares técnicos de estabilidad, diseño responsive, flujo de compra, catálogo, seguridad RLS y rendimiento móvil:

1. **Cuello de botella de imágenes y transferencia resuelto definitivamente:**
   - 992 miniaturas WebP generadas y servidas desde Supabase Storage.
   - Peso del Home reducido de **14.0 MB a 1.21 MB (-91.4% de ahorro global)**.
   - LCP móvil del Home reducido de **40.0 s a 3.9 s** (superando la meta de < 4.0 s).
   - Riesgo de egress en Supabase superado ampliamente: margen para miles de visitas mensuales sin saturar la cuota.
2. **Auditoría en URL productiva de Vercel superada con éxito:**
   - Despliegue activo desde la rama **`master`** en `https://florer-a-miraflores.vercel.app/`.
   - Performance móvil sube a **74 en Home**, **71 en Catálogo** y **75 en Ficha de Producto**.
   - Accesibilidad: **96/100** en Home, **95/100** en Catálogo, **96/100** en Producto.
   - Best Practices: **100/100** en todas las rutas auditadas.
   - SEO: **100/100** en todas las rutas auditadas.

---

## 1. Rendimiento y Carga de Red (Auditoría Lighthouse Móvil Comparativa Oficial)

Datos reales extraídos directamente de los reportes oficiales generados por Lighthouse CLI v12.8.2 en modo móvil con estrangulamiento estándar:

| Página                         | Métrica               | Fase 06 (Línea Base) | Fase 06-B (Preview Local) | **Vercel Producción (`master`)** |      Variación Global       |
| :----------------------------- | :-------------------- | :------------------: | :-----------------------: | :------------------------------: | :-------------------------: |
| **Home (`/`)**                 | **Peso Total de Red** |       14.0 MB        |          1.70 MB          |           **1.21 MB**            |   **-91.4% (-12.79 MB)**    |
|                                | **LCP Móvil**         |        40.0 s        |           5.1 s           |            **3.9 s**             | **-90.2% (Meta < 4 s ✅)**  |
|                                | **Performance**       |          58          |            66             |              **74**              |       **+16 puntos**        |
|                                | **Accessibility**     |          89          |            96             |              **96**              | **+7 puntos (Meta ≥90 ✅)** |
|                                | **Best Practices**    |         100          |            100            |             **100**              |       **100/100 ✅**        |
|                                | **SEO**               |         100          |            100            |             **100**              |       **100/100 ✅**        |
| **Catálogo (`/catalogo`)**     | **Peso Total de Red** |        5.3 MB        |          1.02 MB          |           **0.78 MB**            |    **-85.3% (-4.52 MB)**    |
|                                | **LCP Móvil**         |        7.2 s         |           6.8 s           |            **5.8 s**             |         **-1.4 s**          |
|                                | **Performance**       |          64          |            66             |              **71**              |        **+7 puntos**        |
|                                | **Accessibility**     |          95          |            95             |              **95**              |        **95/100 ✅**        |
|                                | **Best Practices**    |         100          |            100            |             **100**              |       **100/100 ✅**        |
|                                | **SEO**               |         100          |            100            |             **100**              |       **100/100 ✅**        |
| **Producto (`/producto/:id`)** | **Peso Total de Red** |        1.9 MB        |          0.55 MB          |           **0.51 MB**            |    **-73.2% (-1.39 MB)**    |
|                                | **LCP Móvil**         |        5.7 s         |           5.0 s           |            **4.7 s**             |         **-1.0 s**          |
|                                | **Performance**       |          73          |            74             |              **75**              |        **+2 puntos**        |
|                                | **Accessibility**     |          96          |            96             |              **96**              |        **96/100 ✅**        |
|                                | **Best Practices**    |         100          |            100            |             **100**              |       **100/100 ✅**        |
|                                | **SEO**               |         100          |            100            |             **100**              |       **100/100 ✅**        |

_Archivos de reporte auditados en Vercel:_

- [`docs/evidencias/fase-06b/lighthouse-vercel/home.report.json`](file:///docs/evidencias/fase-06b/lighthouse-vercel/home.report.json)
- [`docs/evidencias/fase-06b/lighthouse-vercel/catalogo.report.json`](file:///docs/evidencias/fase-06b/lighthouse-vercel/catalogo.report.json)
- [`docs/evidencias/fase-06b/lighthouse-vercel/producto.report.json`](file:///docs/evidencias/fase-06b/lighthouse-vercel/producto.report.json)

---

## 2. Resumen de Pruebas y Evidencias Técnicas

| Prueba / Auditoría                        | Comando / Métrica                                  | Resultado                                                                            | Archivo de Evidencia                                                                                                   |
| :---------------------------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Pipeline de Verificación**              | `npm run verify`                                   | ✅ 0 errores ESLint, TypeScript limpio, tests pasando, build exitoso                 | [`docs/evidencias/fase-06b/verify-espaciado.txt`](file:///docs/evidencias/fase-06b/verify-espaciado.txt)               |
| **Suite Completa E2E**                    | `npm run test:e2e`                                 | ✅ 56 passed, 2 skipped controlados (0 fallos en mobile y desktop)                   | [`docs/evidencias/fase-06b/e2e-suite.txt`](file:///docs/evidencias/fase-06b/e2e-suite.txt)                             |
| **Verificación de Miniaturas en Storage** | `node scripts/verificar-miniaturas-subidas.mjs`    | ✅ 496 originales con 992 miniaturas WebP; 50/50 peticiones HEAD en HTTP 200 OK      | [`docs/evidencias/fase-06b/miniaturas-verificacion.txt`](file:///docs/evidencias/fase-06b/miniaturas-verificacion.txt) |
| **Fallback ante 404**                     | `npx playwright test tests/e2e/thumbnails.spec.ts` | ✅ 6/6 tests pasados (bloqueo forzado a `/thumbs/` conmuta limpiamente a originales) | [`docs/evidencias/fase-06b/e2e.txt`](file:///docs/evidencias/fase-06b/e2e.txt)                                         |
| **Seguridad de Datos (RLS)**              | `npm run test:rls`                                 | ✅ 10/10 tests pasados con anon key (escrituras bloqueadas salvo admin autenticado)  | [`docs/evidencias/fase-06/rls.txt`](file:///docs/evidencias/fase-06/rls.txt)                                           |
| **Sitemap XML**                           | `node scripts/generate-sitemap.mjs`                | ✅ 437 URLs indexables generadas                                                     | [`public/sitemap.xml`](file:///public/sitemap.xml)                                                                     |
| **Robots.txt**                            | Configuración de indexación                        | ✅ Rutas públicas abiertas, `/admin` y `/confirmacion` bloqueadas                    | [`public/robots.txt`](file:///public/robots.txt)                                                                       |

---

## 3. Acciones Administrativas Finales (Pendientes de Jack)

1. **Revisión de Pedidos de Prueba en Producción:**
   - En la tabla `pedidos` de Supabase existen registros de prueba (`FM-TEST01`, etc.); evaluar si se eliminan antes del tráfico público masivo.
2. **Eliminar Usuario Temporal de Autenticación:**
   - En el panel de Supabase (_Authentication > Users_), eliminar la cuenta de prueba `test_admin_temp@floreriamiraflores.com`.
3. **Desactivar Registro Público de Usuarios:**
   - En Supabase (_Authentication > Providers > Email_), desmarcar la casilla _"Allow new users to sign up"_ para evitar registros no autorizados.
4. **Reparto de Productos en Nacimientos:**
   - En el panel administrativo (`/admin/productos`), asignar productos reales a las subcategorías _Nacimientos Niño_ y _Nacimientos Niña_ para activarlas en el menú.
5. **Aprobación de Tabla de Tulipanes (SQL 004):**
   - Confirmar si se aplica la reorganización de 13 productos en `docs/sql/004-tulipanes-reasignacion.sql`.
6. **Configuración de Dominio Personalizado:**
   - Apuntar los registros DNS de `floreriamiraflores.com` hacia Vercel cuando se decida dar de baja la web antigua.
