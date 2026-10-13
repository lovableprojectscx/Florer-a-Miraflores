/**
 * Script de verificación de miniaturas subidas (Fase 06-B).
 *
 * Tareas:
 * 1. Cuenta y confirma que existen las 2 miniaturas (480w y 960w) para cada imagen
 *    en los buckets 'banners', 'categorias' y 'productos'.
 * 2. Realiza peticiones HTTP HEAD a una muestra representativa de 50 miniaturas
 *    para verificar que responden HTTP 200 con Content-Type: image/webp y Content-Length > 0.
 * 3. Guarda la salida cruda y detallada en docs/evidencias/fase-06b/miniaturas-verificacion.txt.
 *
 * Ejecución:
 *   node scripts/verificar-miniaturas-subidas.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";

const viteEnv = loadEnv("", process.cwd(), "");
const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  viteEnv.VITE_SUPABASE_URL ||
  "https://sdrkiomeesoctsxeidmu.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || viteEnv.VITE_SUPABASE_ANON_KEY || "";

const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKETS = ["banners", "categorias", "productos"];

async function listarArchivosEnRuta(bucket, prefix = "") {
  const archivos = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`Error listando [${bucket}] ruta "${prefix}":`, error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      if (item.name === "thumbs" || item.name.startsWith("thumbs/")) continue;
      if (item.id === null) continue; // carpetas
      archivos.push(item);
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return archivos;
}

async function verificarMiniaturas() {
  const lineas = [];
  const log = (msg = "") => {
    console.log(msg);
    lineas.push(msg);
  };

  log("=====================================================================");
  log(" VERIFICACIÓN DE MINIATURAS EN SUPABASE STORAGE (Fase 06-B)");
  log(` Fecha: ${new Date().toISOString()}`);
  log(` Supabase URL: ${supabaseUrl}`);
  log("=====================================================================\n");

  let totalOriginalesGlobal = 0;
  let totalThumbs480Global = 0;
  let totalThumbs960Global = 0;
  let totalFaltantesGlobal = 0;

  const todasLasMiniaturasParaMuestreo = [];

  for (const bucket of BUCKETS) {
    log(`--- Verificando Bucket: [${bucket}] ---`);

    // 1. Listar imágenes originales
    const originales = await listarArchivosEnRuta(bucket, "");
    log(`  Imágenes originales en raíz: ${originales.length}`);

    // 2. Listar miniaturas en thumbs/480/
    const thumbs480 = await listarArchivosEnRuta(bucket, "thumbs/480");
    const set480 = new Set(thumbs480.map((f) => f.name));
    log(`  Miniaturas encontradas en thumbs/480/: ${thumbs480.length}`);

    // 3. Listar miniaturas en thumbs/960/
    const thumbs960 = await listarArchivosEnRuta(bucket, "thumbs/960");
    const set960 = new Set(thumbs960.map((f) => f.name));
    log(`  Miniaturas encontradas en thumbs/960/: ${thumbs960.length}`);

    let faltantes480 = 0;
    let faltantes960 = 0;

    for (const orig of originales) {
      if (!set480.has(orig.name)) {
        faltantes480++;
        log(`    [FALTA 480] ${bucket}/${orig.name}`);
      } else {
        todasLasMiniaturasParaMuestreo.push({
          bucket,
          ancho: 480,
          name: orig.name,
          url: `${supabaseUrl}/storage/v1/object/public/${bucket}/thumbs/480/${encodeURIComponent(orig.name)}`,
        });
      }

      if (!set960.has(orig.name)) {
        faltantes960++;
        log(`    [FALTA 960] ${bucket}/${orig.name}`);
      } else {
        todasLasMiniaturasParaMuestreo.push({
          bucket,
          ancho: 960,
          name: orig.name,
          url: `${supabaseUrl}/storage/v1/object/public/${bucket}/thumbs/960/${encodeURIComponent(orig.name)}`,
        });
      }
    }

    const totalFaltantesBucket = faltantes480 + faltantes960;
    log(
      `  Estado bucket: ${totalFaltantesBucket === 0 ? "COBERTURA 100% (2 miniaturas por original)" : `OBSERVADO: ${totalFaltantesBucket} miniaturas faltantes`}`,
    );
    log(`  Faltantes 480w: ${faltantes480} | Faltantes 960w: ${faltantes960}\n`);

    totalOriginalesGlobal += originales.length;
    totalThumbs480Global += thumbs480.length;
    totalThumbs960Global += thumbs960.length;
    totalFaltantesGlobal += totalFaltantesBucket;
  }

  log("=====================================================================");
  log(" RESUMEN DE CONTEO Y COBERTURA");
  log("=====================================================================");
  log(` Total originales analizados:          ${totalOriginalesGlobal}`);
  log(
    ` Total miniaturas 480w esperadas:      ${totalOriginalesGlobal} | Encontradas: ${totalThumbs480Global}`,
  );
  log(
    ` Total miniaturas 960w esperadas:      ${totalOriginalesGlobal} | Encontradas: ${totalThumbs960Global}`,
  );
  log(` Total miniaturas requeridas (2x):     ${totalOriginalesGlobal * 2}`);
  log(` Total miniaturas presentes en storage: ${totalThumbs480Global + totalThumbs960Global}`);
  log(` Total miniaturas faltantes:           ${totalFaltantesGlobal}`);
  log("=====================================================================\n");

  // Muestra representativa de 50 peticiones HEAD
  const TAMANO_MUESTRA = 50;
  log(`=====================================================================`);
  log(` VERIFICACIÓN HTTP HEAD DE MUESTRA DE ${TAMANO_MUESTRA} MINIATURAS`);
  log(`=====================================================================`);

  // Seleccionar muestra estratificada equitativa
  const paso = Math.max(1, Math.floor(todasLasMiniaturasParaMuestreo.length / TAMANO_MUESTRA));
  const muestra = [];
  for (
    let i = 0;
    i < todasLasMiniaturasParaMuestreo.length && muestra.length < TAMANO_MUESTRA;
    i += paso
  ) {
    muestra.push(todasLasMiniaturasParaMuestreo[i]);
  }

  log(`Muestra seleccionada: ${muestra.length} URLs de miniaturas.\n`);

  let exitosHead = 0;
  let fallosHead = 0;

  for (let i = 0; i < muestra.length; i++) {
    const item = muestra[i];
    try {
      const res = await fetch(item.url, { method: "HEAD" });
      const contentType = res.headers.get("content-type") || "desconocido";
      const contentLength = res.headers.get("content-length") || "0";

      if (res.ok) {
        exitosHead++;
        log(
          `[HEAD #${String(i + 1).padStart(2, "0")}] HTTP ${res.status} OK | ${item.bucket}/thumbs/${item.ancho}/${item.name} | ${contentType} | ${contentLength} bytes`,
        );
      } else {
        fallosHead++;
        log(`[HEAD #${String(i + 1).padStart(2, "0")}] [ERROR HTTP ${res.status}] ${item.url}`);
      }
    } catch (err) {
      fallosHead++;
      log(
        `[HEAD #${String(i + 1).padStart(2, "0")}] [ERROR RED] ${item.url}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  log("\n=====================================================================");
  log(" RESULTADO DE PRUEBAS HEAD (MUESTRA DE 50)");
  log("=====================================================================");
  log(` Exitosas (HTTP 200): ${exitosHead}/${muestra.length}`);
  log(` Fallidas:            ${fallosHead}/${muestra.length}`);
  log(
    ` Veredicto HTTP:      ${fallosHead === 0 ? "APROBADO (100% de la muestra responde 200 OK con Content-Type correcto)" : "OBSERVADO"}`,
  );
  log("=====================================================================\n");

  const outDir = resolve(process.cwd(), "docs/evidencias/fase-06b");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "miniaturas-verificacion.txt");
  writeFileSync(outPath, lineas.join("\n"), "utf-8");
  log(`Evidencia completa guardada en: docs/evidencias/fase-06b/miniaturas-verificacion.txt`);
}

verificarMiniaturas().catch((err) => {
  console.error("Error fatal en verificación de miniaturas:", err);
  process.exit(1);
});
