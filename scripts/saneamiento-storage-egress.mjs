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

loadEnvFile(path.resolve(".env.local"));
loadEnvFile(path.resolve(".env.e2e.local"));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Faltan variables VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY o E2E_ADMIN_*");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

async function listAllFolder(bucket, folder = "") {
  const all = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`Error listando ${bucket}/${folder}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (!item.id) continue; // es subcarpeta virtual (ej. "thumbs")
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      all.push({
        bucket,
        name: fullPath,
        baseName: fullPath.replace(/^thumbs\/(480|960)\//, ""),
        size: Number(item.metadata?.size || 0),
        cacheControl: item.metadata?.cacheControl || "",
        mimetype: item.metadata?.mimetype || "",
      });
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function listBucketComplete(bucket) {
  const [root, t480, t960] = await Promise.all([
    listAllFolder(bucket, ""),
    listAllFolder(bucket, "thumbs/480"),
    listAllFolder(bucket, "thumbs/960"),
  ]);
  return [...root, ...t480, ...t960];
}

async function fetchAllRows(table, columns) {
  const rows = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + step - 1);
    if (error) {
      console.warn(`Aviso leyendo ${table}: ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < step) break;
    from += step;
  }
  return rows;
}

function extractBucketAndBase(url) {
  if (!url || typeof url !== "string") return null;
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(\?.*|#.*)?$/);
  if (!m) return null;
  const bucket = m[1];
  const rawPath = m[2];
  const baseName = rawPath.replace(/^thumbs\/(480|960)\//, "");
  return { bucket, rawPath, baseName };
}

async function runPool(items, concurrency, worker) {
  let idx = 0;
  const results = [];
  async function next() {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await worker(items[current], current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
  return results;
}

async function main() {
  console.log("1. Autenticando sesión administrativa en Supabase...");
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (authErr) throw new Error(`Auth falló: ${authErr.message}`);

  const buckets = ["productos", "categorias", "banners", "testimonios", "popup"];
  console.log("2. Inventariando todos los objetos en Supabase Storage...");
  const beforeObjectsByBucket = {};
  let totalBeforeFiles = 0;
  let totalBeforeBytes = 0;

  for (const b of buckets) {
    const list = await listBucketComplete(b);
    beforeObjectsByBucket[b] = list;
    totalBeforeFiles += list.length;
    totalBeforeBytes += list.reduce((acc, x) => acc + x.size, 0);
  }
  console.log(
    `   -> Inventario inicial: ${totalBeforeFiles} archivos (${(totalBeforeBytes / 1024 / 1024).toFixed(2)} MB)`,
  );

  console.log("3. Extrayendo el 100% de referencias activas e inactivas en PostgreSQL...");
  const [
    productos,
    banners,
    blogPosts,
    categorias,
    colecciones,
    configs,
    popups,
    recuerdos,
    testimonios,
  ] = await Promise.all([
    fetchAllRows("productos", "id,imagenes"),
    fetchAllRows("banners", "id,imagen_url,imagen_mobile_url"),
    fetchAllRows("blog_posts", "id,imagen_portada_url"),
    fetchAllRows("categorias", "id,imagen_url"),
    fetchAllRows("colecciones_home", "id,imagen_custom_url"),
    fetchAllRows("config", "id,logo_url"),
    fetchAllRows("popup", "id,imagen_url"),
    fetchAllRows("recuerdos", "id,imagen_portada_url,fotos_galeria"),
    fetchAllRows("testimonios", "id,imagen_url"),
  ]);

  const rawUrls = [];
  for (const r of productos) if (Array.isArray(r.imagenes)) rawUrls.push(...r.imagenes);
  for (const r of banners) {
    if (r.imagen_url) rawUrls.push(r.imagen_url);
    if (r.imagen_mobile_url) rawUrls.push(r.imagen_mobile_url);
  }
  for (const r of blogPosts) if (r.imagen_portada_url) rawUrls.push(r.imagen_portada_url);
  for (const r of categorias) if (r.imagen_url) rawUrls.push(r.imagen_url);
  for (const r of colecciones) if (r.imagen_custom_url) rawUrls.push(r.imagen_custom_url);
  for (const r of configs) if (r.logo_url) rawUrls.push(r.logo_url);
  for (const r of popups) if (r.imagen_url) rawUrls.push(r.imagen_url);
  for (const r of recuerdos) {
    if (r.imagen_portada_url) rawUrls.push(r.imagen_portada_url);
    if (Array.isArray(r.fotos_galeria)) rawUrls.push(...r.fotos_galeria);
  }
  for (const r of testimonios) if (r.imagen_url) rawUrls.push(r.imagen_url);

  const referencedBaseSet = new Set();
  const referencedExactSet = new Set();
  for (const u of rawUrls) {
    const parsed = extractBucketAndBase(u);
    if (parsed) {
      referencedBaseSet.add(`${parsed.bucket}/${parsed.baseName}`);
      referencedExactSet.add(`${parsed.bucket}/${parsed.rawPath}`);
    }
  }

  console.log(`   -> Productos leídos: ${productos.length} | Bases únicas referenciadas: ${referencedBaseSet.size}`);
  if (productos.length < 950 || referencedBaseSet.size < 980) {
    throw new Error("Guarda de seguridad activada: conteo de referencias menor al esperado. Abortando.");
  }

  // 4. Purgar huérfanos verificados
  console.log("4. Identificando y purgando archivos huérfanos sin referencia en BD...");
  let orphansDeleted = 0;
  let orphanBytesFreed = 0;

  for (const b of buckets) {
    const orphans = beforeObjectsByBucket[b].filter((obj) => {
      const isRef =
        referencedBaseSet.has(`${b}/${obj.baseName}`) || referencedExactSet.has(`${b}/${obj.name}`);
      return !isRef;
    });
    if (orphans.length > 0) {
      console.log(`   -> Bucket '${b}': eliminando ${orphans.length} archivos huérfanos...`);
      for (let i = 0; i < orphans.length; i += 100) {
        const chunk = orphans.slice(i, i + 100);
        const { error: delErr } = await supabase.storage
          .from(b)
          .remove(chunk.map((o) => o.name));
        if (delErr) {
          console.warn(`      Error eliminando lote en ${b}: ${delErr.message}`);
        } else {
          orphansDeleted += chunk.length;
          orphanBytesFreed += chunk.reduce((acc, o) => acc + o.size, 0);
        }
      }
    }
  }
  console.log(
    `   -> Huérfanos eliminados: ${orphansDeleted} archivos (${(orphanBytesFreed / 1024 / 1024).toFixed(2)} MB liberados)`,
  );

  // Refrescar inventario tras purga de huérfanos
  const currentByBucket = {};
  for (const b of buckets) {
    currentByBucket[b] = await listBucketComplete(b);
  }

  // 5. Generar miniaturas faltantes + recomprimir originales 4K + corregir Cache-Control en S3
  console.log("5. Generando miniaturas 480w/960w faltantes y optimizando originales 4K (Cache-Control 1 año)...");
  let thumbs480Created = 0;
  let thumbs960Created = 0;
  let originalsOptimized = 0;
  let cacheHeadersFixed = 0;
  let bytesSavedRecompress = 0;

  for (const b of ["productos", "popup", "categorias", "banners", "testimonios"]) {
    const list = currentByBucket[b];
    const roots = list.filter((o) => !o.name.startsWith("thumbs/") && o.mimetype.startsWith("image/"));
    const set480 = new Set(
      list.filter((o) => o.name.startsWith("thumbs/480/")).map((o) => o.baseName),
    );
    const set960 = new Set(
      list.filter((o) => o.name.startsWith("thumbs/960/")).map((o) => o.baseName),
    );

    const workItems = roots.filter((rootObj) => {
      const missing480 = !set480.has(rootObj.baseName);
      const missing960 = !set960.has(rootObj.baseName);
      const is4kBatch =
        b === "productos" &&
        (rootObj.baseName.startsWith("pack5_4k_") || rootObj.baseName.startsWith("prod_4k_"));
      const isOversized = b === "productos" && rootObj.size > 360 * 1024;
      return missing480 || missing960 || is4kBatch || isOversized;
    });

    if (workItems.length > 0) {
      console.log(`   -> Procesando ${workItems.length} activos en bucket '${b}' (concurrencia 10)...`);
      let done = 0;
      await runPool(workItems, 10, async (rootObj) => {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${b}/${encodeURIComponent(rootObj.name)}`;
        const resp = await fetch(publicUrl);
        if (!resp.ok) {
          console.warn(`      No se pudo descargar ${b}/${rootObj.name}: HTTP ${resp.status}`);
          return;
        }
        const inputBuf = Buffer.from(await resp.arrayBuffer());

        const missing480 = !set480.has(rootObj.baseName);
        const missing960 = !set960.has(rootObj.baseName);
        const is4kBatch =
          b === "productos" &&
          (rootObj.baseName.startsWith("pack5_4k_") || rootObj.baseName.startsWith("prod_4k_"));
        const isOversized = b === "productos" && rootObj.size > 360 * 1024;

        if (missing480) {
          const buf480 = await sharp(inputBuf)
            .resize(480, 480, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();
          const { error } = await supabase.storage
            .from(b)
            .upload(`thumbs/480/${rootObj.baseName}`, buf480, {
              upsert: true,
              contentType: "image/webp",
              cacheControl: "31536000",
            });
          if (!error) thumbs480Created++;
        }

        if (missing960) {
          const buf960 = await sharp(inputBuf)
            .resize(960, 960, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
          const { error } = await supabase.storage
            .from(b)
            .upload(`thumbs/960/${rootObj.baseName}`, buf960, {
              upsert: true,
              contentType: "image/webp",
              cacheControl: "31536000",
            });
          if (!error) thumbs960Created++;
        }

        if (is4kBatch || isOversized) {
          const maxDim = b === "banners" ? 2560 : 1600;
          const optBuf = await sharp(inputBuf)
            .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
          const finalBuf = optBuf.length < inputBuf.length ? optBuf : inputBuf;
          const { error } = await supabase.storage.from(b).upload(rootObj.name, finalBuf, {
            upsert: true,
            contentType: "image/webp",
            cacheControl: "31536000",
          });
          if (!error) {
            originalsOptimized++;
            cacheHeadersFixed++;
            if (inputBuf.length > finalBuf.length) {
              bytesSavedRecompress += inputBuf.length - finalBuf.length;
            }
          }
        }

        done++;
        if (done % 50 === 0 || done === workItems.length) {
          console.log(`      [${b}] ${done}/${workItems.length} completados...`);
        }
      });
    }
  }

  // 6. Normalizar Cache-Control de 1 año en testimonios/thumbs (que tenían max-age=3600)
  const testThumbs = currentByBucket["testimonios"].filter((o) => o.name.startsWith("thumbs/"));
  if (testThumbs.length > 0) {
    console.log(`6. Normalizando Cache-Control a 1 año en ${testThumbs.length} miniaturas de testimonios...`);
    await runPool(testThumbs, 8, async (tObj) => {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/testimonios/${tObj.name}`;
      const resp = await fetch(publicUrl);
      if (!resp.ok) return;
      const buf = Buffer.from(await resp.arrayBuffer());
      const { error } = await supabase.storage.from("testimonios").upload(tObj.name, buf, {
        upsert: true,
        contentType: "image/webp",
        cacheControl: "31536000",
      });
      if (!error) cacheHeadersFixed++;
    });
  }

  // 7. Inventario final certificado
  console.log("7. Calculando inventario final certificado...");
  let totalAfterFiles = 0;
  let totalAfterBytes = 0;
  const summaryByBucket = {};
  for (const b of buckets) {
    const list = await listBucketComplete(b);
    totalAfterFiles += list.length;
    const bytes = list.reduce((acc, x) => acc + x.size, 0);
    totalAfterBytes += bytes;
    summaryByBucket[b] = {
      files: list.length,
      mb: Number((bytes / 1024 / 1024).toFixed(2)),
      rootFiles: list.filter((x) => !x.name.startsWith("thumbs/")).length,
      thumbs480: list.filter((x) => x.name.startsWith("thumbs/480/")).length,
      thumbs960: list.filter((x) => x.name.startsWith("thumbs/960/")).length,
    };
  }

  const report = {
    executedAt: new Date().toISOString(),
    before: {
      totalFiles: totalBeforeFiles,
      totalMB: Number((totalBeforeBytes / 1024 / 1024).toFixed(2)),
    },
    actions: {
      orphansDeleted,
      orphanMBFreed: Number((orphanBytesFreed / 1024 / 1024).toFixed(2)),
      thumbs480Created,
      thumbs960Created,
      originalsOptimized,
      recompressionMBSaved: Number((bytesSavedRecompress / 1024 / 1024).toFixed(2)),
      s3CacheHeadersFixed: cacheHeadersFixed,
    },
    after: {
      totalFiles: totalAfterFiles,
      totalMB: Number((totalAfterBytes / 1024 / 1024).toFixed(2)),
      netMBReduction: Number(((totalBeforeBytes - totalAfterBytes) / 1024 / 1024).toFixed(2)),
      netPctReduction: Number((((totalBeforeBytes - totalAfterBytes) / totalBeforeBytes) * 100).toFixed(1)),
      buckets: summaryByBucket,
    },
  };

  const outPath = path.resolve("docs/certificaciones-qa-final/datos/storage-egress-audit.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  console.log("\n=== REPORTE FINAL CERTIFICADO DE STORAGE Y EGRESS ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("ERROR FATAL:", err);
  process.exit(1);
});
