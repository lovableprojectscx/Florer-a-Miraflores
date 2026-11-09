# Scripts de Automatización y Mantenimiento — Florería Miraflores

Este directorio reúne los scripts ejecutables para el pipeline de build, auditorías de infraestructura en Supabase, certificación QA y migraciones de datos.

---

## 1. Pipeline de Compilación y Producción

| Script | Descripción | Ejecución |
| :--- | :--- | :--- |
| `scripts/postbuild.js` | Prepara los artefactos SSR y cliente en `dist/` para el runtime de Vercel Serverless (`api/index.js`). | Invocado automáticamente en `npm run build` (`postbuild`). |
| `scripts/generate-sitemap.mjs` | Genera `public/sitemap.xml` sincronizado con las rutas públicas y productos activos en Supabase. | `node scripts/generate-sitemap.mjs` |

---

## 2. Auditoría Formal QA, Carga y Certificación (`v1.14.0`)

| Script | Descripción | Salida Generada |
| :--- | :--- | :--- |
| `scripts/generar-certificaciones-qa.mjs` | Ejecuta las suites en vivo contra Supabase, mide latencias y compila los 6 informes formales en PDF. | `docs/certificaciones-qa-final/pdf/*.pdf` |
| `scripts/load-test.mjs` | Prueba de estrés de 100 usuarios concurrentes (100 VUs / 500 peticiones) contra el Edge CDN. | `docs/certificaciones-qa-final/datos/load-test-metrics.json` |
| `scripts/saneamiento-storage-egress.mjs` | Saneamiento maestro de Storage S3: purga de huérfanos, compresión `<= 1600px`, miniaturas `480w/960w` y `Cache-Control: 31536000`. | `docs/certificaciones-qa-final/datos/storage-egress-audit.json` |
| `scripts/auditoria-egress-real.mjs` | Auditoría empírica de Egress REST/API de Supabase: mide bytes brutos y Gzip por endpoint y calcula la proyección mensual. | `docs/certificaciones-qa-final/datos/egress-audit-metrics.json` |

---

## 3. Verificación de Imágenes y Miniaturas

| Script | Descripción |
| :--- | :--- |
| `scripts/verificar-imagenes.mjs` | Auditoría concurrente HTTP HEAD sobre el 100% de URLs de producto en Supabase. |
| `scripts/verificar-miniaturas-subidas.mjs` | Comprueba la paridad de miniaturas `/thumbs/480/` y `/thumbs/960/` en Storage. |
| `scripts/generar-miniaturas.mjs` | Generación y sincronización de miniaturas WebP para catálogo. |
| `scripts/generar-miniaturas-recuerdos.mjs` | Generación de miniaturas WebP para el módulo de recuerdos florales. |

---

## 4. Scripts de Migración y Mantenimiento de Catálogo (Fases Históricas)

| Script | Módulo / Fase |
| :--- | :--- |
| `scripts/migrar-db-completa.mjs` | Restauración de esquemas y tablas relacionales. |
| `scripts/cargar-catalogo-450.mjs` | Siembra inicial de los 450 productos del catálogo histórico. |
| `scripts/aplicar-limpieza-titulos.mjs` | Normalización de mayúsculas y sufijos en nombres de productos. |
| `scripts/diagnostico-categorias.mjs` | Diagnóstico en solo lectura del árbol taxonómico. |
| `scripts/procesar-testimonios.mjs` | Carga y optimización de testimonios con avatares WebP. |
| `scripts/sembrar-recuerdos.mjs` | Siembra de recuerdos institucionales. |
| `scripts/subir-banners-reales.mjs` | Optimización y subida de banners de cabecera. |
| `scripts/subir-categorias.mjs` | Sincronización de fotos de portadas de categorías. |

---

> **Nota:** La carpeta de datos crudos locales y respaldos JSON (`scripts/data/`) está excluida de Git para proteger respaldos voluminosos de producción.
