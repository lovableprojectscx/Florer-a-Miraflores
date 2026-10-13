/**
 * Script de generación de miniaturas WebP (Fase 06-B).
 * Genera variantes 480w y 960w (calidad ~72) para imágenes en los buckets
 * 'banners', 'categorias' y 'productos'.
 *
 * Reglas de seguridad estrictas:
 * - NO usa service role key bajo ninguna circunstancia.
 * - Se autentica vía signInWithPassword usando E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 *   extraídos de .env.e2e.local (el admin tiene permisos por RLS/is_admin()).
 * - Usa upsert: false (si una miniatura ya existe en el bucket, se salta sin error).
 * - NUNCA borra, modifica ni reemplaza archivos originales.
 * - Modo por defecto: --dry-run (solo calcula y simula).
 * - Modo subida: solo con flag explícito --upload.
 *
 * Ejecución:
 *   node scripts/generar-miniaturas.mjs --dry-run
 *   node scripts/generar-miniaturas.mjs --upload
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

import { loadEnv } from "vite";

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

// Cargar variables de entorno de Vite (.env, .env.local) y .env.e2e.local
const viteEnv = loadEnv("", process.cwd(), "");
const e2eEnv = parseEnvFile(resolve(process.cwd(), ".env.e2e.local"));

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  e2eEnv.VITE_SUPABASE_URL ||
  viteEnv.VITE_SUPABASE_URL ||
  "https://sdrkiomeesoctsxeidmu.supabase.co";

const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  e2eEnv.VITE_SUPABASE_ANON_KEY ||
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  "";

const adminEmail =
  process.env.E2E_ADMIN_EMAIL ||
  e2eEnv.E2E_ADMIN_EMAIL ||
  "pedidos@floreriamiraflores.com";

const adminPassword =
  process.env.E2E_ADMIN_PASSWORD ||
  e2eEnv.E2E_ADMIN_PASSWORD ||
  "";

const isDryRun = !process.argv.includes("--upload") || process.argv.includes("--dry-run");
const BUCKETS = ["banners", "categorias", "productos"];

// Inicializar cliente estándar con anon key (sin service role)
const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function autenticarAdmin() {
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Credenciales de administrador no encontradas en .env.e2e.local (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)"
    );
  }

  const { data, error } = await client.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (error || !data.session) {
    throw new Error(`Error autenticando admin (${adminEmail}): ${error?.message}`);
  }

  return data.user;
}

async function listarArchivosBucket(bucket) {
  const archivos = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list("", {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`Error listando bucket ${bucket}:`, error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      // Ignorar carpetas 'thumbs' y pseudo-directorios
      if (item.name === "thumbs" || item.name.startsWith("thumbs/")) continue;
      if (item.id === null) continue;
      archivos.push(item);
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return archivos;
}

async function procesarImagen(bucket, item) {
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${item.name}`;

  try {
    const res = await fetch(publicUrl);
    if (!res.ok) {
      return {
        bucket,
        name: item.name,
        ok: false,
        error: `HTTP ${res.status}`,
      };
    }

    const arrayBuf = await res.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuf);
    const originalBytes = originalBuffer.byteLength;

    // Generar miniatura 480w
    const thumb480Buffer = await sharp(originalBuffer)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();

    // Generar miniatura 960w
    const thumb960Buffer = await sharp(originalBuffer)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();

    return {
      bucket,
      name: item.name,
      ok: true,
      originalBytes,
      thumb480Bytes: thumb480Buffer.byteLength,
      thumb960Bytes: thumb960Buffer.byteLength,
      thumb480Buffer,
      thumb960Buffer,
    };
  } catch (err) {
    return {
      bucket,
      name: item.name,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function esErrorRecursoExistente(err) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const status = String(err.statusCode || err.status || "");
  const errCode = (err.error || "").toLowerCase();
  return (
    msg.includes("already exists") ||
    msg.includes("duplicate") ||
    status === "409" ||
    errCode === "duplicate"
  );
}

async function subirMiniatura(bucket, ruta, buffer) {
  const { data, error } = await client.storage.from(bucket).upload(ruta, buffer, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false, // Regla estricta: nunca sobreescribir ni tocar existentes
  });

  if (error) {
    if (esErrorRecursoExistente(error)) {
      return { ok: true, saltado: true };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, saltado: false };
}

async function ejecutar() {
  const lineasReporte = [];
  const log = (msg = "") => {
    console.log(msg);
    lineasReporte.push(msg);
  };

  log("=====================================================================");
  log(` GENERADOR DE MINIATURAS WEBP (Fase 06-B)`);
  log(` Modo: ${isDryRun ? "DRY-RUN (Simulación sin cambios)" : "SUBIDA REAL (Admin Auth, upsert: false)"}`);
  log(` Fecha: ${new Date().toISOString()}`);
  log("=====================================================================\n");

  if (!isDryRun) {
    log(`Autenticando en Supabase como administrador (${adminEmail})...`);
    const adminUser = await autenticarAdmin();
    log(`Autenticación exitosa. User ID: ${adminUser.id}\n`);
  }

  let granTotalOriginalBytes = 0;
  let granTotal480Bytes = 0;
  let granTotal960Bytes = 0;
  let granTotalImagenes = 0;
  let granTotalErrores = 0;
  let granTotalSubidas = 0;
  let granTotalSaltadas = 0;

  for (const bucket of BUCKETS) {
    log(`--- Bucket: [${bucket}] ---`);
    const archivos = await listarArchivosBucket(bucket);
    log(`Archivos encontrados en raíz: ${archivos.length}`);

    let bucketOriginalBytes = 0;
    let bucket480Bytes = 0;
    let bucket960Bytes = 0;
    let exitos = 0;
    let errores = 0;
    let subidas = 0;
    let saltadas = 0;

    // Procesar con concurrencia controlada
    const CONCURRENCY = 6;
    for (let i = 0; i < archivos.length; i += CONCURRENCY) {
      const lote = archivos.slice(i, i + CONCURRENCY);
      const resultados = await Promise.all(lote.map((item) => procesarImagen(bucket, item)));

      for (const res of resultados) {
        if (!res.ok) {
          errores++;
          log(`  [ERROR LECTURA] ${res.name}: ${res.error}`);
          continue;
        }

        exitos++;
        bucketOriginalBytes += res.originalBytes;
        bucket480Bytes += res.thumb480Bytes;
        bucket960Bytes += res.thumb960Bytes;

        if (!isDryRun) {
          // Subida de miniatura 480w
          const sub480 = await subirMiniatura(bucket, `thumbs/480/${res.name}`, res.thumb480Buffer);
          if (!sub480.ok) {
            log(`  [ERROR SUBIDA 480] ${res.name}: ${sub480.error}`);
          } else if (sub480.saltado) {
            saltadas++;
          } else {
            subidas++;
          }

          // Subida de miniatura 960w
          const sub960 = await subirMiniatura(bucket, `thumbs/960/${res.name}`, res.thumb960Buffer);
          if (!sub960.ok) {
            log(`  [ERROR SUBIDA 960] ${res.name}: ${sub960.error}`);
          } else if (sub960.saltado) {
            saltadas++;
          } else {
            subidas++;
          }
        }
      }

      if (!isDryRun && (i + CONCURRENCY) % 30 === 0) {
        log(`  ... procesadas ${Math.min(i + CONCURRENCY, archivos.length)}/${archivos.length} imágenes`);
      }
    }

    const ahorro480Pct =
      bucketOriginalBytes > 0
        ? (((bucketOriginalBytes - bucket480Bytes) / bucketOriginalBytes) * 100).toFixed(1)
        : "0";
    const ahorro960Pct =
      bucketOriginalBytes > 0
        ? (((bucketOriginalBytes - bucket960Bytes) / bucketOriginalBytes) * 100).toFixed(1)
        : "0";

    log(`  Procesadas con éxito: ${exitos}`);
    log(`  Errores de lectura/generación: ${errores}`);
    if (!isDryRun) {
      log(`  Archivos subidos nuevos: ${subidas}`);
      log(`  Archivos saltados (ya existían): ${saltadas}`);
    }
    log(`  Peso original total: ${(bucketOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
    log(`  Peso miniaturas 480w: ${(bucket480Bytes / 1024 / 1024).toFixed(2)} MB (-${ahorro480Pct}%)`);
    log(`  Peso miniaturas 960w: ${(bucket960Bytes / 1024 / 1024).toFixed(2)} MB (-${ahorro960Pct}%)\n`);

    granTotalImagenes += exitos;
    granTotalErrores += errores;
    granTotalSubidas += subidas;
    granTotalSaltadas += saltadas;
    granTotalOriginalBytes += bucketOriginalBytes;
    granTotal480Bytes += bucket480Bytes;
    granTotal960Bytes += bucket960Bytes;
  }

  const granAhorro480Pct =
    granTotalOriginalBytes > 0
      ? (((granTotalOriginalBytes - granTotal480Bytes) / granTotalOriginalBytes) * 100).toFixed(1)
      : "0";
  const granAhorro960Pct =
    granTotalOriginalBytes > 0
      ? (((granTotalOriginalBytes - granTotal960Bytes) / granTotalOriginalBytes) * 100).toFixed(1)
      : "0";

  log("=====================================================================");
  log(` RESUMEN GLOBAL`);
  log("=====================================================================");
  log(` Total imágenes originales:     ${granTotalImagenes}`);
  log(` Total errores:                 ${granTotalErrores}`);
  if (!isDryRun) {
    log(` Total miniaturas subidas:      ${granTotalSubidas}`);
    log(` Total miniaturas saltadas:     ${granTotalSaltadas}`);
  }
  log(` Peso original total:           ${(granTotalOriginalBytes / 1024 / 1024).toFixed(2)} MB`);
  log(` Peso miniaturas 480w:          ${(granTotal480Bytes / 1024 / 1024).toFixed(2)} MB (-${granAhorro480Pct}%)`);
  log(` Peso miniaturas 960w:          ${(granTotal960Bytes / 1024 / 1024).toFixed(2)} MB (-${granAhorro960Pct}%)`);
  log(` Ahorro estimado móvil (480w):  -${granAhorro480Pct}%`);
  log(` Ahorro estimado desktop (960w):-${granAhorro960Pct}%`);
  log("=====================================================================\n");

  const outDir = resolve(process.cwd(), "docs/evidencias/fase-06b");
  mkdirSync(outDir, { recursive: true });
  const fileName = isDryRun ? "dry-run.txt" : "subida-miniaturas.txt";
  writeFileSync(resolve(outDir, fileName), lineasReporte.join("\n"), "utf-8");
  log(`Reporte guardado en docs/evidencias/fase-06b/${fileName}`);
}

ejecutar().catch((err) => {
  console.error("Error fatal en script de miniaturas:", err);
  process.exit(1);
});
