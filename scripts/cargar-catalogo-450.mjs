import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = "https://hdudifvzlblmqgiepjgd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWRpZnZ6bGJsbXFnaWVwamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjUzMjEsImV4cCI6MjEwODEwMTMyMX0.03TibywqXFk9oAdakeGy-p23D8crYmpy1S1WgRF3bRs";
const adminEmail = "pedidos@floreriamiraflores.com";
const adminPassword = "idenza.site";

const CONCURRENCY = 4; // 4 trabajadores paralelos para máxima velocidad sin saturación

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("==========================================================");
  console.log("  CARGA MASIVA Y OPTIMIZACIÓN — 450 PRODUCTOS 4K");
  console.log("==========================================================");

  // 1. Cargar manifiesto
  const manifestPath = resolve(process.cwd(), "scripts/data/catalogo-450.json");
  if (!existsSync(manifestPath)) {
    throw new Error(
      `No se encontró el manifiesto en ${manifestPath}. Ejecuta preparar-manifest-450.mjs primero.`,
    );
  }
  const items = JSON.parse(readFileSync(manifestPath, "utf-8"));
  console.log(`\nManifiesto cargado: ${items.length} productos listos para procesar.`);

  // 2. Autenticar Admin
  console.log("\nAutenticando administrador en Supabase...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw new Error(`Error de autenticación admin: ${authErr.message}`);
  console.log(`✓ Admin autenticado: ${auth.user.email}`);

  // 3. Obtener productos ya existentes en la BD para evitar duplicados
  console.log("Consultando productos ya registrados...");
  const { data: prodsExistentes, error: prodErr } = await supabase
    .from("productos")
    .select("id, nombre, orden, imagenes");
  if (prodErr) throw prodErr;

  const existingByImage = new Set();
  const existingByName = new Set();
  for (const p of prodsExistentes || []) {
    if (p.nombre) existingByName.add(p.nombre.toLowerCase().trim());
    if (p.imagenes && p.imagenes.length > 0) {
      for (const img of p.imagenes) {
        const parts = img.split("/");
        existingByImage.add(parts[parts.length - 1]);
      }
    }
  }
  console.log(`Productos ya en BD: ${prodsExistentes?.length || 0}`);

  // 4. Cola de procesamiento con concurrencia controlada
  let completados = 0;
  let subidos = 0;
  let insertados = 0;
  let saltados = 0;
  let errores = 0;
  const startTime = Date.now();

  async function procesarItem(item, idx) {
    const itemNum = idx + 1;
    const { targetFileName, sourcePath, nombre, precio, descripcion, categoria_id, tags, order } =
      item;

    // Verificar si ya está en BD
    const yaEnBd =
      existingByName.has(nombre.toLowerCase().trim()) || existingByImage.has(targetFileName);
    if (yaEnBd) {
      saltados++;
      completados++;
      return;
    }

    try {
      // 1. Leer y optimizar con Sharp
      const absSource = resolve(process.cwd(), sourcePath);
      const rawBuffer = readFileSync(absSource);

      // WebP Original (1200x1200px max, sin ampliar)
      const bOrig = await sharp(rawBuffer)
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      // Miniatura 960w (a partir del buffer 1200px optimizado para rapidez)
      const b960 = await sharp(bOrig)
        .resize({ width: 960, height: 960, fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

      // Miniatura 480w
      const b480 = await sharp(b960)
        .resize({ width: 480, height: 480, fit: "cover" })
        .webp({ quality: 75 })
        .toBuffer();

      // 2. Subir a Storage
      // a) Original
      const { error: upOrigErr } = await supabase.storage
        .from("productos")
        .upload(targetFileName, bOrig, {
          contentType: "image/webp",
          upsert: true,
        });
      if (upOrigErr) throw new Error(`Upload orig falló: ${upOrigErr.message}`);

      // b) 960w
      const { error: up960Err } = await supabase.storage
        .from("productos")
        .upload(`thumbs/960/${targetFileName}`, b960, {
          contentType: "image/webp",
          upsert: true,
        });
      if (up960Err) throw new Error(`Upload 960w falló: ${up960Err.message}`);

      // c) 480w
      const { error: up480Err } = await supabase.storage
        .from("productos")
        .upload(`thumbs/480/${targetFileName}`, b480, {
          contentType: "image/webp",
          upsert: true,
        });
      if (up480Err) throw new Error(`Upload 480w falló: ${up480Err.message}`);

      subidos++;

      // 3. Insertar en public.productos
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/productos/${targetFileName}`;
      const { error: insErr } = await supabase.from("productos").insert({
        nombre,
        precio,
        descripcion,
        categoria_id,
        tags: tags || [],
        imagenes: [publicUrl],
        activo: true,
        orden: order,
      });

      if (insErr) throw new Error(`Insert BD falló: ${insErr.message}`);

      insertados++;
      completados++;

      // Log periódico
      if (completados % 10 === 0 || completados === items.length) {
        const pct = ((completados / items.length) * 100).toFixed(1);
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
        console.log(
          `[${completados}/${items.length}] (${pct}%) — ${insertados} insertados, ${saltados} saltados (${elapsedSec}s) — Último: "${nombre}" (S/ ${precio})`,
        );
      }
    } catch (err) {
      errores++;
      console.error(`\n❌ Error en [${itemNum}] ${nombre}: ${err.message}`);
    }
  }

  // Ejecución en paralelo con piscina de promesas (p-limit simple)
  console.log(`\nIniciando procesamiento masivo con ${CONCURRENCY} hilos paralelos...\n`);

  let currentIdx = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (currentIdx < items.length) {
      const idx = currentIdx++;
      await procesarItem(items[idx], idx);
    }
  });

  await Promise.all(workers);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n==========================================================");
  console.log("  RESUMEN FINAL DE LA CARGA MASIVA");
  console.log("==========================================================");
  console.log(`- Tiempo total empleado : ${totalTime} segundos`);
  console.log(`- Nuevos productos creados: ${insertados}`);
  console.log(`- Imágenes subidas a Storage: ${subidos * 3} archivos (orig + 960w + 480w)`);
  console.log(`- Productos preexistentes saltados: ${saltados}`);
  console.log(`- Errores encontrados   : ${errores}`);
  console.log("==========================================================\n");
}

main().catch(console.error);
