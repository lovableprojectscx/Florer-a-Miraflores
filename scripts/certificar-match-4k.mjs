/**
 * Script de Certificación 1-a-1 por Huella Visual (dHash 64-bit + RGB 32x32)
 * Modo por defecto: --dry-run (SOLO LECTURA, no modifica nada en Supabase ni BD).
 *
 * Uso:
 *   node scripts/certificar-match-4k.mjs --input <ruta-json-productos> --dir raw-media --out <carpeta-salida>
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    input: "",
    dir: "raw-media",
    out: "docs/certificaciones-qa-final/datos",
    concurrency: 8,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) opts.input = args[++i];
    else if (args[i] === "--dir" && args[i + 1]) opts.dir = args[++i];
    else if (args[i] === "--out" && args[i + 1]) opts.out = args[++i];
    else if (args[i] === "--concurrency" && args[i + 1]) opts.concurrency = Number(args[++i]) || 8;
  }
  return opts;
}

function walkImages(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkImages(full));
    } else if (IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

async function computeFingerprint(inputBufferOrPath) {
  const img = sharp(inputBufferOrPath).rotate();
  const meta = await img.metadata();

  // 1. dHash 64-bit (9x8 grayscale)
  const grayBuf = await img
    .clone()
    .resize(9, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  let dhash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = grayBuf[y * 9 + x];
      const right = grayBuf[y * 9 + x + 1];
      if (left > right) {
        dhash |= 1n << BigInt(y * 8 + x);
      }
    }
  }

  // 2. RGB 32x32 pixel fingerprint (3072 bytes) para distinguir colores exactos
  const rgbBuf = await img
    .clone()
    .resize(32, 32, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();

  return {
    width: meta.width || 0,
    height: meta.height || 0,
    dhash,
    rgbBuf,
  };
}

function hammingDistance(a, b) {
  let xor = a ^ b;
  let count = 0;
  while (xor > 0n) {
    count += Number(xor & 1n);
    xor >>= 1n;
  }
  return count;
}

function rgbSimilarity(bufA, bufB) {
  const len = Math.min(bufA.length, bufB.length);
  if (len === 0) return 0;
  let sumDiff = 0;
  for (let i = 0; i < len; i++) {
    sumDiff += Math.abs(bufA[i] - bufB[i]);
  }
  const mae = sumDiff / len;
  return Number((1 - mae / 255).toFixed(4));
}

function toThumb480Url(url) {
  return url.replace(
    /(\/storage\/v1\/object\/public\/[^/]+)\/(?:thumbs\/\d+\/)?(.+)/,
    "$1/thumbs/480/$2",
  );
}

function extractRowsFromInput(inputPath) {
  let raw = fs.readFileSync(inputPath, "utf-8");
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  if (trimmed.startsWith("{")) {
    const outer = JSON.parse(trimmed);
    if (typeof outer.result === "string") raw = outer.result;
  }
  const start = raw.indexOf('[{"id":');
  const end = raw.lastIndexOf("}]");
  if (start !== -1 && end !== -1) {
    return JSON.parse(raw.slice(start, end + 2));
  }
  throw new Error("No se encontró arreglo JSON válido en --input");
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
  if (!opts.input) {
    console.error("Falta --input <ruta>");
    process.exit(1);
  }

  const rows = extractRowsFromInput(opts.input);
  console.log(`Productos a auditar: ${rows.length}`);

  const localFiles = walkImages(path.resolve(opts.dir));
  console.log(`Archivos locales encontrados en '${opts.dir}': ${localFiles.length}`);

  console.log("Calculando huellas visuales locales (dHash + RGB 32x32)...");
  const localIndex = await runPool(localFiles, opts.concurrency, async (filePath) => {
    try {
      const fp = await computeFingerprint(filePath);
      return {
        filePath,
        relPath: path.relative(process.cwd(), filePath),
        sizeBytes: fs.statSync(filePath).size,
        ...fp,
      };
    } catch (err) {
      console.warn(`Error leyendo ${filePath}: ${err.message}`);
      return null;
    }
  });
  const validLocal = localIndex.filter(Boolean);
  console.log(`Huellas locales válidas: ${validLocal.length}`);

  console.log("Descargando miniaturas actuales desde Supabase Storage y comparando 1-a-1...");
  const matches = await runPool(rows, opts.concurrency, async (row) => {
    const thumbUrl = toThumb480Url(row.url);
    try {
      const resp = await fetch(thumbUrl);
      if (!resp.ok) {
        return {
          id: row.id,
          nombre: row.nombre,
          activo: row.activo,
          url: row.url,
          thumbUrl,
          status: "HTTP_ERROR",
          httpStatus: resp.status,
        };
      }
      const buf = Buffer.from(await resp.arrayBuffer());
      const remoteFp = await computeFingerprint(buf);

      // Evaluar contra todos los archivos locales
      let best = null;
      let secondBest = null;
      for (const loc of validLocal) {
        const dist = hammingDistance(remoteFp.dhash, loc.dhash);
        const sim = rgbSimilarity(remoteFp.rgbBuf, loc.rgbBuf);
        // Score compuesto: prioriza baja distancia Hamming y alta similitud RGB
        const score = sim - dist * 0.02;
        const candidate = {
          relPath: loc.relPath,
          width: loc.width,
          height: loc.height,
          sizeMB: Number((loc.sizeBytes / 1024 / 1024).toFixed(2)),
          hamming: dist,
          rgbSim: sim,
          score,
        };
        if (!best || candidate.score > best.score) {
          secondBest = best;
          best = candidate;
        } else if (!secondBest || candidate.score > secondBest.score) {
          secondBest = candidate;
        }
      }

      let status = "NO_MATCH";
      if (best && best.hamming <= 4 && best.rgbSim >= 0.94) {
        status = "CERTIFIED_EXACT_MATCH";
      } else if (best && best.hamming <= 8 && best.rgbSim >= 0.9) {
        status = "REVIEW_BORDERLINE";
      }

      return {
        id: row.id,
        nombre: row.nombre,
        activo: row.activo,
        url: row.url,
        thumbUrl,
        status,
        bestMatch: best,
        secondBestGap:
          best && secondBest ? Number((best.rgbSim - secondBest.rgbSim).toFixed(4)) : null,
      };
    } catch (err) {
      return {
        id: row.id,
        nombre: row.nombre,
        activo: row.activo,
        url: row.url,
        thumbUrl,
        status: "FETCH_ERROR",
        error: err.message,
      };
    }
  });

  const certified = matches.filter((m) => m.status === "CERTIFIED_EXACT_MATCH");
  const borderline = matches.filter((m) => m.status === "REVIEW_BORDERLINE");
  const noMatch = matches.filter((m) => m.status === "NO_MATCH");
  const errors = matches.filter((m) => m.status === "HTTP_ERROR" || m.status === "FETCH_ERROR");

  const summary = {
    executedAt: new Date().toISOString(),
    mode: "DRY_RUN_READ_ONLY",
    totalAudited: matches.length,
    localFilesScanned: validLocal.length,
    certifiedExactMatches: certified.length,
    borderlineForManualReview: borderline.length,
    noMatchFound: noMatch.length,
    errors: errors.length,
  };

  fs.mkdirSync(opts.out, { recursive: true });
  const jsonOut = path.join(opts.out, "certificacion-match-4k.json");
  fs.writeFileSync(jsonOut, JSON.stringify({ summary, matches }, null, 2), "utf-8");

  console.log("\n=== RESUMEN CERTIFICACIÓN 1-A-1 (DRY RUN) ===");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Reporte JSON guardado en: ${jsonOut}`);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
