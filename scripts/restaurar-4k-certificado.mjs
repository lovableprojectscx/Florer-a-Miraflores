/**
 * Restauración Certificada 1-a-1 de Imágenes 4K -> WebP HD (2048 / 960 / 480)
 *
 * Reglas de seguridad estrictas:
 * - Solo procesa pares con status === "CERTIFIED_EXACT_MATCH" o (rgbSim >= 0.98 y secondBestGap >= 0.005).
 * - Nunca modifica la tabla `productos` en PostgreSQL ni crea archivos huérfanos.
 * - Sobrescribe únicamente la misma ruta exacta (`root`, `thumbs/960`, `thumbs/480`) con Cache-Control 1 año.
 * - Verifica HTTP 200 después de subir y emite certificado JSON auditado.
 *
 * Uso:
 *   node scripts/restaurar-4k-certificado.mjs --manifest <ruta-json> [--execute]
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    manifest: "",
    execute: false,
    concurrency: 6,
    out: "docs/certificaciones-qa-final/datos/certificacion-restauracion-4k-tanda1.json",
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--manifest" && args[i + 1]) opts.manifest = args[++i];
    else if (args[i] === "--execute") opts.execute = true;
    else if (args[i] === "--concurrency" && args[i + 1]) opts.concurrency = Number(args[++i]) || 6;
    else if (args[i] === "--out" && args[i + 1]) opts.out = args[++i];
  }
  return opts;
}

function extractBucketAndName(url) {
  const m = String(url || "").match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(\?.*|#.*)?$/);
  if (!m) return null;
  const bucket = m[1];
  const fileName = m[2].replace(/^thumbs\/\d+\//, "");
  return { bucket, fileName };
}

async function runPool(items, concurrency, worker) {
  let idx = 0;
  const results = new Array(items.length);
  async function next() {
    while (idx < items.length) {
      const cur = idx++;
      results[cur] = await worker(items[cur], cur);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
  return results;
}

async function main() {
  const opts = parseArgs();
  if (!opts.manifest) {
    console.error("Falta --manifest <ruta-certificacion-match-4k.json>");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(opts.manifest, "utf-8"));
  const allMatches = Array.isArray(data.matches) ? data.matches : [];

  // Filtro de tolerancia cero: >= 98% similitud RGB exacta y margen claro respecto al segundo candidato
  const verifiedItems = [];
  const seenUrls = new Set();

  for (const m of allMatches) {
    if (!m.bestMatch) continue;
    const simOk = m.bestMatch.rgbSim >= 0.98;
    const gapOk = m.secondBestGap === null || m.secondBestGap >= 0.005;
    if (!simOk || !gapOk) continue;
    if (seenUrls.has(m.url)) continue;
    seenUrls.add(m.url);

    const parsed = extractBucketAndName(m.url);
    if (!parsed) continue;
    if (!fs.existsSync(m.bestMatch.relPath)) continue;

    verifiedItems.push({
      id: m.id,
      nombre: m.nombre,
      url: m.url,
      bucket: parsed.bucket,
      fileName: parsed.fileName,
      localPath: m.bestMatch.relPath,
      rgbSim: m.bestMatch.rgbSim,
      hamming: m.bestMatch.hamming,
      sourceWidth: m.bestMatch.width,
      sourceHeight: m.bestMatch.height,
    });
  }

  console.log(`Items en manifiesto: ${allMatches.length}`);
  console.log(`Items certificados 1-a-1 (>=98% RGB, 0 ambigüedad): ${verifiedItems.length}`);
  console.log(`Modo: ${opts.execute ? "EJECUCIÓN REAL (UPLOAD)" : "SIMULACIÓN (--dry-run)"}`);

  if (!opts.execute) {
    console.log("Simulación completada. Usa --execute para aplicar la restauración certificada.");
    return;
  }

  loadEnvFile(path.resolve(".env.local"));
  loadEnvFile(path.resolve(".env.e2e.local"));

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "";
  const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Faltan variables de entorno de Supabase/Admin para autenticar la subida.");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (authErr) throw new Error(`Auth falló: ${authErr.message}`);

  let done = 0;
  let uploadedOk = 0;
  let failed = 0;
  let totalBytes2048 = 0;
  let totalBytes960 = 0;
  let totalBytes480 = 0;

  const auditEntries = await runPool(verifiedItems, opts.concurrency, async (item) => {
    try {
      const inputBuf = fs.readFileSync(item.localPath);
      const baseSharp = sharp(inputBuf).rotate();

      const [buf2048, buf960, buf480] = await Promise.all([
        baseSharp
          .clone()
          .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 90 })
          .toBuffer(),
        baseSharp
          .clone()
          .resize(960, 960, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 86 })
          .toBuffer(),
        baseSharp
          .clone()
          .resize(480, 480, { fit: "inside", withoutEnlargement: true })
          .webp({ quality: 84 })
          .toBuffer(),
      ]);

      const meta2048 = await sharp(buf2048).metadata();

      const uploadOpts = {
        upsert: true,
        contentType: "image/webp",
        cacheControl: "31536000",
      };

      const [r1, r2, r3] = await Promise.all([
        supabase.storage.from(item.bucket).upload(item.fileName, buf2048, uploadOpts),
        supabase.storage.from(item.bucket).upload(`thumbs/960/${item.fileName}`, buf960, uploadOpts),
        supabase.storage.from(item.bucket).upload(`thumbs/480/${item.fileName}`, buf480, uploadOpts),
      ]);

      if (r1.error || r2.error || r3.error) {
        failed++;
        return {
          ...item,
          status: "UPLOAD_ERROR",
          errors: [r1.error?.message, r2.error?.message, r3.error?.message].filter(Boolean),
        };
      }

      // Verificación HTTP 200 inmediata sobre la URL pública principal
      const checkResp = await fetch(item.url, { method: "HEAD" });
      if (!checkResp.ok) {
        failed++;
        return { ...item, status: "VERIFY_HTTP_ERROR", httpStatus: checkResp.status };
      }

      uploadedOk++;
      totalBytes2048 += buf2048.length;
      totalBytes960 += buf960.length;
      totalBytes480 += buf480.length;

      done++;
      if (done % 50 === 0 || done === verifiedItems.length) {
        console.log(`Procesados ${done}/${verifiedItems.length}...`);
      }

      return {
        id: item.id,
        nombre: item.nombre,
        url: item.url,
        localPath: item.localPath,
        rgbSim: item.rgbSim,
        hamming: item.hamming,
        restoredWidth: meta2048.width,
        restoredHeight: meta2048.height,
        kb2048: Number((buf2048.length / 1024).toFixed(1)),
        kb960: Number((buf960.length / 1024).toFixed(1)),
        kb480: Number((buf480.length / 1024).toFixed(1)),
        httpVerified: checkResp.status,
        status: "CERTIFIED_RESTORED",
      };
    } catch (err) {
      failed++;
      return { ...item, status: "EXCEPTION", error: err.message };
    }
  });

  const certReport = {
    executedAt: new Date().toISOString(),
    totalAttempted: verifiedItems.length,
    restoredAndHttpVerified: uploadedOk,
    failed,
    totalMB_2048: Number((totalBytes2048 / 1024 / 1024).toFixed(2)),
    totalMB_960: Number((totalBytes960 / 1024 / 1024).toFixed(2)),
    totalMB_480: Number((totalBytes480 / 1024 / 1024).toFixed(2)),
    entries: auditEntries,
  };

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify(certReport, null, 2), "utf-8");

  console.log("\n=== CERTIFICADO FINAL DE RESTAURACIÓN 4K ===");
  console.log(
    JSON.stringify(
      {
        totalAttempted: certReport.totalAttempted,
        restoredAndHttpVerified: certReport.restoredAndHttpVerified,
        failed: certReport.failed,
        totalMB_2048: certReport.totalMB_2048,
        totalMB_960: certReport.totalMB_960,
        totalMB_480: certReport.totalMB_480,
      },
      null,
      2,
    ),
  );
  console.log(`Certificado guardado en: ${opts.out}`);
}

main().catch((err) => {
  console.error("ERROR FATAL:", err);
  process.exit(1);
});
