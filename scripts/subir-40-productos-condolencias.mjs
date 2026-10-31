import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sdrkiomeesoctsxeidmu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcmtpb21lZXNvY3RzeGVpZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjE3MzAsImV4cCI6MjA5NDczNzczMH0.PSWFG95ZjsabOTNnOLf1CkA035H7tU3EwSNnEAYy0u8";

const adminEmail = "pedidos@floreriamiraflores.com";
const adminPassword = "idenza.site";

const CAT_IDS = {
  condolenciasPadre: "99ef0939-f5c5-4d0b-9aeb-41040869b7d4",
  coronasFunebres: "e3f73ae6-9cbd-49f1-b9a8-b81244131fd5",
  cruces: "4c777708-89be-43b6-86c8-3b22e533d1d5",
  lagrimaPedestal: "581afa16-236f-47aa-b3aa-d0054ada8081",
  lagrimas: "3044ac75-5545-4d0f-a636-e5b97248def4",
  mantos: "dc8c0325-67ca-42ac-91c6-76a5aee2250f",
  arreglosPremium: "a7a4a6c0-784a-4415-818a-5921f04e57a7",
};

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("==================================================================");
  console.log("  SUBIDA Y ASIGNACIÓN DE PRODUCTOS DE CONDOLENCIAS (GRUPO 5 4K)  ");
  console.log("==================================================================");

  // 1. Autenticar Admin
  console.log("\n1. Autenticando admin en Supabase...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;
  console.log("✓ Admin autenticado:", auth.user.email);

  // 2. Reclasificar productos mal asignados
  console.log("\n2. Reclasificando productos erróneos en la base de datos...");

  // A. Mover Arreglo Festivo Luz Dorada N° 4 a Arreglos Premium
  const { error: errFestivo } = await supabase
    .from("productos")
    .update({ categoria_id: CAT_IDS.arreglosPremium })
    .eq("id", "8317d3fb-c542-409e-a134-7ce23ed2959e");
  if (errFestivo) {
    console.warn("   Error reclasificando Luz Dorada N° 4:", errFestivo.message);
  } else {
    console.log("✓ 'Arreglo Festivo Luz Dorada N° 4' trasladado a Arreglos Premium.");
  }

  // B. Mover Corona Homenaje Sublime Paz Eterna a Coronas Fúnebres
  const { error: errCorona } = await supabase
    .from("productos")
    .update({ categoria_id: CAT_IDS.coronasFunebres })
    .eq("id", "d15c5b39-abd8-478e-a8d3-b9acedeb602f");
  if (errCorona) {
    console.warn("   Error reclasificando Corona Homenaje:", errCorona.message);
  } else {
    console.log("✓ 'Corona Homenaje Sublime Paz Eterna' trasladada a Coronas Fúnebres.");
  }

  // 3. Procesar las 40 imágenes de Grupo 5 y subirlas
  const manifestPath = resolve(process.cwd(), "scripts/data/catalogo-450.json");
  const cat450 = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const g5Items = cat450.filter(
    (c) => c.sourcePath && c.sourcePath.includes("Grupo 5")
  );

  console.log(`\n3. Procesando y subiendo ${g5Items.length} imágenes 4K (WebP + Thumbs 960/480)...`);

  const productosParaInsertar = [];
  const uploadOptions = {
    contentType: "image/webp",
    cacheControl: "max-age=31536000, public",
    upsert: true,
  };

  for (let idx = 0; idx < g5Items.length; idx++) {
    const item = g5Items[idx];
    const fullSourcePath = resolve(process.cwd(), item.sourcePath);

    if (!existsSync(fullSourcePath)) {
      console.warn(`   [ALERTA] Archivo no encontrado: ${fullSourcePath}`);
      continue;
    }

    // Determinar categoría exacta por morfología del arreglo fúnebre
    let targetCatId = CAT_IDS.coronasFunebres;
    if (item.nombre.startsWith("Cruz")) {
      targetCatId = CAT_IDS.cruces;
    } else if (item.nombre.startsWith("Lágrima con Pedestal")) {
      targetCatId = CAT_IDS.lagrimaPedestal;
    } else if (item.nombre.startsWith("Lágrima")) {
      targetCatId = CAT_IDS.lagrimas;
    } else if (item.nombre.startsWith("Corona")) {
      targetCatId = CAT_IDS.coronasFunebres;
    }

    // A. Buffer WebP Full (max 2048)
    const bufFull = await sharp(fullSourcePath)
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // B. Buffer WebP 960 (tarjetas catálogo)
    const buf960 = await sharp(fullSourcePath)
      .resize(960, 960, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // C. Buffer WebP 480 (móvil)
    const buf480 = await sharp(fullSourcePath)
      .resize(480, 480, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    // Subir a Supabase Storage
    const { error: eFull } = await supabase.storage
      .from("productos")
      .upload(item.targetFileName, bufFull, uploadOptions);
    if (eFull) console.warn(`   Aviso subida full ${item.targetFileName}:`, eFull.message);

    const { error: e960 } = await supabase.storage
      .from("productos")
      .upload(`thumbs/960/${item.targetFileName}`, buf960, uploadOptions);
    if (e960) console.warn(`   Aviso subida 960 ${item.targetFileName}:`, e960.message);

    const { error: e480 } = await supabase.storage
      .from("productos")
      .upload(`thumbs/480/${item.targetFileName}`, buf480, uploadOptions);
    if (e480) console.warn(`   Aviso subida 480 ${item.targetFileName}:`, e480.message);

    const imageUrl = `${supabaseUrl}/storage/v1/object/public/productos/${item.targetFileName}`;

    productosParaInsertar.push({
      nombre: item.nombre,
      precio: item.precio,
      descripcion: item.descripcion,
      categoria_id: targetCatId,
      tags: Array.isArray(item.tags) ? item.tags : [],
      activo: true,
      orden: item.order || 600 + idx,
      imagenes: [imageUrl],
      created_at: new Date().toISOString(),
    });

    if ((idx + 1) % 5 === 0 || idx + 1 === g5Items.length) {
      console.log(`   Procesados ${idx + 1}/${g5Items.length} productos...`);
    }
  }

  // 4. Insertar productos en la tabla 'productos'
  console.log("\n4. Insertando los 40 productos en Supabase...");
  const { data: inserted, error: insErr } = await supabase
    .from("productos")
    .insert(productosParaInsertar)
    .select("id, nombre, categoria_id");
  if (insErr) throw insErr;
  console.log(`✓ Insertados ${inserted.length} productos correctamente.`);

  // 5. Configurar orden e imagen_url representativa para las subcategorías de Condolencias
  console.log("\n5. Actualizando imagen_url y orden de subcategorías...");
  const subcatConfig = [
    {
      id: CAT_IDS.coronasFunebres,
      orden: 1,
      imagen_url: `${supabaseUrl}/storage/v1/object/public/productos/thumbs/960/prod-320-corona-funebre-solemne-paz.webp`,
    },
    {
      id: CAT_IDS.cruces,
      orden: 2,
      imagen_url: `${supabaseUrl}/storage/v1/object/public/productos/thumbs/960/prod-321-cruz-floral-redencion-divina.webp`,
    },
    {
      id: CAT_IDS.lagrimaPedestal,
      orden: 3,
      imagen_url: `${supabaseUrl}/storage/v1/object/public/productos/thumbs/960/prod-322-lagrima-con-pedestal-esperanza-eterna.webp`,
    },
    {
      id: CAT_IDS.lagrimas,
      orden: 4,
      imagen_url: `${supabaseUrl}/storage/v1/object/public/productos/thumbs/960/prod-325-lagrima-funebre-descanso-eterno.webp`,
    },
    {
      id: CAT_IDS.mantos,
      orden: 5,
    },
  ];

  for (const cfg of subcatConfig) {
    const updatePayload = { orden: cfg.orden };
    if (cfg.imagen_url) updatePayload.imagen_url = cfg.imagen_url;
    await supabase.from("categorias").update(updatePayload).eq("id", cfg.id);
  }
  console.log("✓ Subcategorías configuradas con orden visual e imagen de portada.");

  // 6. Verificación final de conteos
  console.log("\n6. Verificación final de conteos en Supabase:");
  const subcats = [
    { name: "Coronas Fúnebres", id: CAT_IDS.coronasFunebres },
    { name: "Cruces", id: CAT_IDS.cruces },
    { name: "Lágrima con Pedestal", id: CAT_IDS.lagrimaPedestal },
    { name: "Lágrimas", id: CAT_IDS.lagrimas },
    { name: "Mantos", id: CAT_IDS.mantos },
    { name: "Condolencias (directo)", id: CAT_IDS.condolenciasPadre },
  ];

  for (const s of subcats) {
    const { count } = await supabase
      .from("productos")
      .select("*", { count: "exact", head: true })
      .eq("categoria_id", s.id);
    console.log(`   - ${s.name}: ${count} productos`);
  }

  const { count: totalProds } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true });
  console.log(`\n✓ Total general de productos en la tienda: ${totalProds}`);
  console.log("==================================================================");
  console.log("  ¡PROCESO FINALIZADO CON ÉXITO!");
  console.log("==================================================================");
}

main().catch(console.error);
