import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sdrkiomeesoctsxeidmu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcmtpb21lZXNvY3RzeGVpZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjE3MzAsImV4cCI6MjA5NDczNzczMH0.PSWFG95ZjsabOTNnOLf1CkA035H7tU3EwSNnEAYy0u8";

const adminEmail = "pedidos@floreriamiraflores.com";
const adminPassword = "idenza.site";

const localFolder = "c:\\Users\\JACK FRANKLIN\\Downloads\\Imagenes Sofia web\\Paquete 6 - Sofia web fotos 04";

const client = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const isUpload = process.argv.includes("--upload");
  console.log("=====================================================================");
  console.log(` GENERADOR DE MINIATURAS FALTANTES OCT-15 (Modo: ${isUpload ? "SUBIDA REAL" : "DRY-RUN"})`);
  console.log("=====================================================================");

  if (isUpload) {
    console.log("Autenticando admin...");
    const { data: auth, error: authErr } = await client.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (authErr) throw authErr;
    console.log("✓ Admin autenticado:", auth.user.email);
  }

  // 1. Indexar archivos PNG locales
  const fs = await import("node:fs");
  const localMap = new Map();
  const grupos = fs.readdirSync(localFolder);
  for (const g of grupos) {
    const gp = join(localFolder, g);
    if (fs.statSync(gp).isDirectory()) {
      const files = fs.readdirSync(gp).filter((f) => f.endsWith(".png") && !f.startsWith("."));
      for (const f of files) {
        localMap.set(f.toLowerCase(), join(gp, f));
      }
    }
  }
  console.log(`✓ Indexados ${localMap.size} archivos locales en Paquete 6.`);

  // 2. Obtener lista de productos que usan prod_4k_ en la BD
  const { data: prods, error: pErr } = await client
    .from("productos")
    .select("id, nombre, imagenes")
    .not("imagenes", "is", null);
  if (pErr) throw pErr;

  const prod4kList = [];
  for (const p of prods) {
    const url = p.imagenes?.[0];
    if (url && url.includes("prod_4k_")) {
      const filename = url.split("/").pop();
      prod4kList.push({ id: p.id, nombre: p.nombre, filename });
    }
  }
  console.log(`✓ Encontrados ${prod4kList.length} productos con prod_4k_ en la BD.`);

  // 3. Emparejar con archivos locales
  let matched = 0;
  let missing = 0;
  const plan = [];

  for (const item of prod4kList) {
    let matchedPath = null;
    const lowerFilename = item.filename.toLowerCase();

    for (const [key, fullPath] of localMap.entries()) {
      const keyBase = key.replace(".png", "").toLowerCase().slice(0, 8);
      if (lowerFilename.includes(keyBase)) {
        matchedPath = fullPath;
        break;
      }
    }

    if (matchedPath) {
      matched++;
      plan.push({ ...item, localPath: matchedPath });
    } else {
      missing++;
      console.warn("No match for:", item.filename);
    }
  }

  console.log(`✓ Emparejados exitosamente: ${matched} / ${prod4kList.length}`);

  // 4. Procesar y subir miniaturas
  let totalOrigBytes = 0;
  let total480Bytes = 0;
  let total960Bytes = 0;

  for (let i = 0; i < plan.length; i++) {
    const item = plan[i];
    const rawBuffer = fs.readFileSync(item.localPath);
    totalOrigBytes += rawBuffer.byteLength;

    const thumb480 = await sharp(rawBuffer)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();
    total480Bytes += thumb480.byteLength;

    const thumb960 = await sharp(rawBuffer)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();
    total960Bytes += thumb960.byteLength;

    if (isUpload) {
      // Subir a thumbs/480/
      const path480 = `thumbs/480/${item.filename}`;
      const { error: err480 } = await client.storage.from("productos").upload(path480, thumb480, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

      // Subir a thumbs/960/
      const path960 = `thumbs/960/${item.filename}`;
      const { error: err960 } = await client.storage.from("productos").upload(path960, thumb960, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

      if (err480) console.error(`Error 480 [${item.filename}]:`, err480.message);
      if (err960) console.error(`Error 960 [${item.filename}]:`, err960.message);

      if ((i + 1) % 25 === 0 || i === plan.length - 1) {
        console.log(`  Progreso: ${i + 1} / ${plan.length} miniaturas subidas.`);
      }
    }
  }

  console.log("\n--- Resumen de Optimización ---");
  console.log(`Archivos procesados: ${plan.length}`);
  console.log(`Peso original (PNG locales): ${(totalOrigBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Peso miniaturas 480w: ${(total480Bytes / 1024 / 1024).toFixed(2)} MB (-${((1 - total480Bytes / totalOrigBytes) * 100).toFixed(1)}%)`);
  console.log(`Peso miniaturas 960w: ${(total960Bytes / 1024 / 1024).toFixed(2)} MB (-${((1 - total960Bytes / totalOrigBytes) * 100).toFixed(1)}%)`);
}

main().catch(console.error);
