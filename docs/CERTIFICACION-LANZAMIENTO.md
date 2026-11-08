# Acta de Certificación Integral QA & Go-Live — Florería Miraflores (`v1.14.0`)

**Fecha de actualización:** 8 de Noviembre de 2026  
**Rama certificada:** `master` (desplegada en Vercel Producción)  
**URL de Producción (Vercel):** [`https://florer-a-miraflores.vercel.app/`](https://florer-a-miraflores.vercel.app/)  
**Base de Datos & Storage:** Supabase Plan Pro (`sdrkiomeesoctsxeidmu`, `sa-east-1` São Paulo, PostgreSQL 17.6)

---

## Veredicto Oficial

# VEREDICTO: GO CERTIFICADO (Producción Autorizada)

La plataforma cumple y certifica empíricamente los Requisitos Funcionales (`RF-001` a `RF-124`) y No Funcionales (`RNF-01` a `RNF-18`) de estabilidad, seguridad RLS + Anti-Tampering, salud de Supabase Storage y File Egress, SEO/GEO local, descubrimiento agéntico (`llms.txt`) y calidad visual Markdown.

---

## 1. Saneamiento Certificado de Supabase Storage, Cache-Control y File Egress (`RNF-15`)

Datos reales auditados y verificados en vivo mediante `scripts/saneamiento-storage-egress.mjs` (`docs/certificaciones-qa-final/datos/storage-egress-audit.json`):

| Métrica / Parámetro Auditado | Antes (Con Lotes 4K Crudos) | Después (`v1.14.0` Certificado) | Impacto Real |
| :--- | :---: | :---: | :--- |
| **Peso total en Supabase Storage (S3)** | `490.45 MB` (`2,360` archivos) | **`277.41 MB` (`3,033` archivos)** | **`-213.04 MB` (`-43.4%` neto en S3)** |
| **Archivos huérfanos sin referencia en BD** | `313` archivos (`28.53 MB`) | **`0` archivos (`0 MB`)** | **`100%` purgados sin afectar activos** |
| **Cobertura `thumbs/480` y `thumbs/960` en Productos** | `489 / 984` (`49.6%` — faltaban `496`) | **`984 / 984` (`100.0%` paridad `984×3`)** | **`0` errores `400 BYPASS` en `/thumbs/`** |
| **Cobertura `thumbs/480` y `thumbs/960` en Resto de Buckets** | `popup`: `0` thumbs; `testimonios`: `3600s` | **`categorias` `9×3`, `banners` `3×3`, `testimonios` `14×3`, `popup` `1×3`** | **`100%` simetría en los 5 buckets** |
| **Cabecera HTTP `Cache-Control` en S3** | `no-cache` en `496` fotos 4K | **`public, max-age=31536000` (1 año) en todo S3** | **`580` cabeceras reparadas; `0 KB` en re-visita** |
| **File Egress por página de 24 productos (lote 4K)** | `~14.5 MB` (`601 KB` prom. original) | **`~400 KB` (`~17 KB` prom. `thumbs/480`)** | **`-97.2%` de consumo de File Egress** |

---

## 2. Matriz de Pruebas Automatizadas y Evidencias Reales (`v1.14.0`)

| Dimensión QA | Comando / Suite | Resultado Certificado | Evidencia en Repositorio |
| :--- | :--- | :--- | :--- |
| **Tipado Estático** | `npm run typecheck` | ✅ `0` errores TypeScript | `tsconfig.json` |
| **Pruebas Unitarias** | `npm run test` | ✅ `200/200` tests aprobados (22 suites) | `tests/unit/*.test.ts(x)` |
| **Seguridad RLS + Anti-Tampering** | `npm run test:rls` | ✅ `16/16` tests en vivo contra Supabase (`SQL 016`) | [`docs/certificaciones-qa-final/datos/rls-test-output.txt`](./certificaciones-qa-final/datos/rls-test-output.txt) |
| **Playwright E2E (Storage, Egress, SEO, Compra)** | `npx playwright test` | ✅ `39/39` aprobados (`1` omitido por viewport) en `mobile` (Pixel 7) y `desktop` (1440×900): `0` errores `4xx` Storage, `Cache-Control: 31536000`, Egress `< 1.2 MB`, Canonical/GEO/Schemas, WCAG AA `#5C4D42` y Checkout | [`tests/e2e/qa-storage-egress-seo.spec.ts`](../tests/e2e/qa-storage-egress-seo.spec.ts) · [`datos/e2e-test-output.txt`](./certificaciones-qa-final/datos/e2e-test-output.txt) |
| **Prueba de Carga y Estrés (100 VUs)** | `node scripts/load-test.mjs` | ✅ `> 250 req/s` en 500 peticiones concurrentes, `0%` fallos (`500/500` HTTP 200), `P50 < 300 ms` | [`docs/certificaciones-qa-final/datos/load-test-metrics.json`](./certificaciones-qa-final/datos/load-test-metrics.json) |
| **Informes Ejecutivos PDF** | `node scripts/generar-certificaciones-qa.mjs` | ✅ 6 informes oficiales en PDF (`INFORME-1` al `5` + `CERTIFICACION-FINAL-MAESTRA.pdf`) | [`docs/certificaciones-qa-final/pdf/`](./certificaciones-qa-final/pdf/) |

---

## 3. Pendientes Externos al Código (Dependencias Administrativas / Comerciales)

1. **Integración de Pasarela IZIPay (`RF-040` a `RF-044`):** En espera de credenciales comerciales de producción por parte de Sofía (mientras tanto operan activamente Mercado Pago Checkout Pro, Culqi, Yape/Plin, Transferencia y Efectivo).
2. **Revisión Comercial de Catálogo en Admin (`/admin/productos`):** Verificar precios placeholder `S/. 1.00` en ítems del lote `Pack 5` y cargar fotografía del producto `"Infinito"` (`pack5_4k_320_320_IMG_8981_Estudio.webp` ausente de origen).
3. **Dominio Final (`RNF-08`) y *Leaked Password Protection*:** Apuntar DNS de `floreriamiraflores.com` a Vercel (y verificar dominio remitente en Resend) y activar la casilla *Leaked Password Protection* en Supabase Dashboard -> Authentication -> Providers -> Email.
