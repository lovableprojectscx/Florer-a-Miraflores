# Guía Certificada de Restauración 4K (Para la Otra PC)

**Objetivo:** Restaurar la nitidez HD (`2048 px` calidad `90`, `960 px` calidad `86` y `480 px` calidad `84`) de los **`492` productos `pack5_4k_*` / `prod_4k_*`** (más los `12` pendientes de Tanda 1) desde las carpetas originales de la otra PC, **garantizando 100 % que ningún producto reciba la foto de otro**.

---

## Reglas Estrictas (Cero Suposiciones)
1. **Nunca confiar solo en nombres de archivo ni manifiestos.** Siempre validar visualmente con huella matemática (`rgbSim >= 0.98` y `secondBestGap >= 0.005`).
2. **Nunca modificar la tabla `productos` en PostgreSQL** ni borrar archivos del Storage.
3. **Siempre sobrescribir exactamente la misma ruta** (`<archivo>.webp`, `thumbs/960/<archivo>.webp`, `thumbs/480/<archivo>.webp`) con `Cache-Control: 31536000`.
4. **Si una foto tiene `rgbSim < 0.98` o margen `< 0.005`, excluirla automáticamente.**

---

## Paso 1: Exportar la lista de productos pendientes desde Supabase

Ejecutar en SQL (solo lectura) o mediante script contra Supabase para obtener los productos aún pendientes (`pack5_4k_*`, `prod_4k_*` y los 12 excluidos de Tanda 1):

```sql
SELECT id, nombre, activo, imagenes[1] AS url
FROM productos
WHERE imagenes[1] LIKE '%pack5_4k_%'
   OR imagenes[1] LIKE '%prod_4k_%'
ORDER BY nombre;
```

Guardar el resultado como JSON en `pendientes-tanda2.json` (arreglo `[{ "id", "nombre", "activo", "url" }]`).

---

## Paso 2: Certificación Visual 1-a-1 (`--dry-run`, Solo Lectura)

Apuntar `--dir` a la carpeta local donde están los originales 4K en esa PC:

```bash
node scripts/certificar-match-4k.mjs \
  --input pendientes-tanda2.json \
  --dir "<RUTA_CARPETA_4K_OTRA_PC>" \
  --out "docs/certificaciones-qa-final/datos"
```

Revisar el resumen impreso y confirmar:
- `errors: 0`
- Que todos los pares a restaurar cumplan `rgbSim >= 0.98` y `secondBestGap >= 0.005`.

---

## Paso 3: Simulación previa de restauración (`--dry-run`)

```bash
node scripts/restaurar-4k-certificado.mjs \
  --manifest "docs/certificaciones-qa-final/datos/certificacion-match-4k.json" \
  --out "docs/certificaciones-qa-final/datos/certificacion-restauracion-4k-tanda2.json"
```

Confirmar el número exacto de `Items certificados 1-a-1`.

---

## Paso 4: Ejecución Certificada (`--execute`)

Requiere `.env.local` + `.env.e2e.local` con credenciales de administrador en Supabase:

```bash
node scripts/restaurar-4k-certificado.mjs \
  --manifest "docs/certificaciones-qa-final/datos/certificacion-match-4k.json" \
  --out "docs/certificaciones-qa-final/datos/certificacion-restauracion-4k-tanda2.json" \
  --execute
```

El script:
1. Genera `2048 px` (WebP q90), `960 px` (WebP q86) y `480 px` (WebP q84) desde cada original 4K.
2. Sube únicamente a la ruta exacta del producto (`upsert: true`, `cacheControl: "31536000"`).
3. Verifica `HTTP 200` en cada URL pública después de subir.
4. Emite el certificado JSON auditado en `docs/certificaciones-qa-final/datos/certificacion-restauracion-4k-tanda2.json`.
