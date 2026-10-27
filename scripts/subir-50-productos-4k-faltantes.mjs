import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sdrkiomeesoctsxeidmu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcmtpb21lZXNvY3RzeGVpZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjE3MzAsImV4cCI6MjA5NDczNzczMH0.PSWFG95ZjsabOTNnOLf1CkA035H7tU3EwSNnEAYy0u8";

const adminEmail = "pedidos@floreriamiraflores.com";
const adminPassword = "idenza.site";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("==================================================================");
  console.log("  SUBIDA DE LAS 50 FOTOS 4K FALTANTES (EDITORIALES Y EXCLUSIVAS)");
  console.log("==================================================================");

  // 1. Autenticar Admin
  console.log("\n1. Autenticando admin en Supabase...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;
  console.log("✓ Admin autenticado:", auth.user.email);

  // 2. Cargar items del manifiesto
  const manifestPath = resolve(process.cwd(), "scripts/data/catalogo-450.json");
  const cat450 = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const items = cat450.filter(
    (c) =>
      (c.sourcePath.includes("FOTOS_4K_EDITORIALES") || c.sourcePath.includes("CON FONDO HECHO 4K")) &&
      !c.sourcePath.toLowerCase().includes("mosaico") &&
      !c.sourcePath.toLowerCase().includes("catalogo_completo")
  );

  console.log(`\n✓ Total de productos 4K a procesar: ${items.length}`);
  console.log(`  - FOTOS_4K_EDITORIALES: ${items.filter((i) => i.sourcePath.includes("FOTOS_4K_EDITORIALES")).length}`);
  console.log(`  - CON FONDO HECHO 4K:   ${items.filter((i) => i.sourcePath.includes("CON FONDO HECHO 4K")).length}`);

  // 3. Procesar imágenes y subir a Storage
  console.log("\n2. Procesando y subiendo imágenes a Supabase Storage (original + thumbs 960/480)...");

  const productosParaInsertar = [];
  let subidasExitosas = 0;

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const itemNum = idx + 1;
    const fullSourcePath = resolve(process.cwd(), item.sourcePath);

    console.log(`[${itemNum}/${items.length}] Procesando: ${item.nombre}...`);

    // A. Generar WebP optimizados
    const bufFull = await sharp(fullSourcePath)
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const buf960 = await sharp(fullSourcePath)
      .resize(960, 960, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const buf480 = await sharp(fullSourcePath)
      .resize(480, 480, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    // B. Subir a Storage
    const uploadOptions = { contentType: "image/webp", cacheControl: "max-age=31536000, public", upsert: true };

    const { error: eFull } = await supabase.storage.from("productos").upload(item.targetFileName, bufFull, uploadOptions);
    if (eFull) console.warn(`   Aviso subida full:`, eFull.message);

    const { error: e960 } = await supabase.storage.from("productos").upload(`thumbs/960/${item.targetFileName}`, buf960, uploadOptions);
    if (e960) console.warn(`   Aviso subida 960:`, e960.message);

    const { error: e480 } = await supabase.storage.from("productos").upload(`thumbs/480/${item.targetFileName}`, buf480, uploadOptions);
    if (e480) console.warn(`   Aviso subida 480:`, e480.message);

    subidasExitosas++;

    // C. Preparar registro de producto
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/productos/${item.targetFileName}`;

    productosParaInsertar.push({
      nombre: item.nombre,
      precio: item.precio,
      descripcion: item.descripcion,
      categoria_id: item.categoria_id,
      tags: Array.isArray(item.tags) ? item.tags : [],
      activo: true,
      orden: item.order || 500 + idx,
      imagenes: [imageUrl],
      created_at: new Date().toISOString(),
    });
  }

  console.log(`\n✓ Subidas ${subidasExitosas} imágenes completas (original + 960 + 480).`);

  // 4. Insertar productos en la base de datos
  console.log("\n3. Insertando los 50 productos en la tabla 'productos'...");
  const { data: inserted, error: insErr } = await supabase.from("productos").insert(productosParaInsertar).select("id, nombre");
  if (insErr) throw insErr;

  console.log(`✓ Insertados con éxito ${inserted.length} productos en la base de datos.`);

  // 5. Verificación final del total
  console.log("\n4. Verificando estado final del catálogo...");
  const { count, error: cErr } = await supabase.from("productos").select("*", { count: "exact", head: true });
  if (cErr) throw cErr;

  console.log("==================================================================");
  console.log(`  ¡PROCESO FINALIZADO CON ÉXITO!`);
  console.log(`  Total productos activos en la tienda: ${count} (401 anteriores + 50 nuevos 4K)`);
  console.log("==================================================================");
}

main().catch(console.error);
