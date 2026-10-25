import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hdudifvzlblmqgiepjgd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWRpZnZ6bGJsbXFnaWVwamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjUzMjEsImV4cCI6MjEwODEwMTMyMX0.03TibywqXFk9oAdakeGy-p23D8crYmpy1S1WgRF3bRs";
const adminEmail = "pedidos@floreriamiraflores.com";
const adminPassword = "idenza.site";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BANNERS_CONFIG = [
  {
    id: "def1c6b2-9c5a-4989-828a-db7d649f75ed",
    sourceFile: resolve(process.cwd(), "scripts/data/banners/banner-1-recuperado.webp"),
    targetFileName: "banner-01-alegrar-dia.webp",
    orden: 1,
    label: "Banner 1: Flores que hablan por ti / La mejor manera de alegrar su día",
  },
  {
    id: "e09c79d9-34dc-40d3-bb69-3f2e41c7bb5d",
    sourceFile: "C:/Users/JACK FRANKLIN/Downloads/_fr (7).png",
    targetFileName: "banner-02-historia-amor.webp",
    orden: 12,
    label: "Banner 2: Para celebrar el amor / Una rosa para cada historia de amor",
  },
  {
    id: "0d27367d-bd9b-4793-be98-25196b00e620",
    sourceFile: "C:/Users/JACK FRANKLIN/Downloads/_fr (9).png",
    targetFileName: "banner-03-delivery-gratuito.webp",
    orden: 13,
    label: "Banner 3: Nos importa llegar a tiempo / Delivery Gratuito",
  },
];

async function main() {
  console.log("==================================================");
  console.log("  SUBIENDO LOS 3 BANNERS REALES A SUPABASE");
  console.log("==================================================");

  // 1. Autenticar Admin
  console.log("\n1. Autenticando administrador...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;
  console.log("✓ Admin autenticado:", auth.user.email);

  // 2. Procesar y subir cada banner
  for (const b of BANNERS_CONFIG) {
    console.log(`\nProcesando ${b.label}...`);
    if (!existsSync(b.sourceFile)) {
      throw new Error(`Archivo no encontrado: ${b.sourceFile}`);
    }

    const rawBuffer = readFileSync(b.sourceFile);

    // Master WebP (calidad 90, hasta 2560px max sin agrandar)
    const masterBuffer = await sharp(rawBuffer)
      .resize({ width: 2560, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();

    console.log(`  Subiendo ${b.targetFileName} (${masterBuffer.length} bytes)...`);
    const { error: errOrig } = await supabase.storage
      .from("banners")
      .upload(b.targetFileName, masterBuffer, {
        contentType: "image/webp",
        upsert: true,
      });
    if (errOrig) throw errOrig;
    console.log("  ✓ Original subido");

    // Miniatura 960w
    const thumb960 = await sharp(masterBuffer)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const { error: err960 } = await supabase.storage
      .from("banners")
      .upload(`thumbs/960/${b.targetFileName}`, thumb960, {
        contentType: "image/webp",
        upsert: true,
      });
    if (err960) throw err960;
    console.log("  ✓ Miniatura 960w subida");

    // Miniatura 480w
    const thumb480 = await sharp(masterBuffer)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const { error: err480 } = await supabase.storage
      .from("banners")
      .upload(`thumbs/480/${b.targetFileName}`, thumb480, {
        contentType: "image/webp",
        upsert: true,
      });
    if (err480) throw err480;
    console.log("  ✓ Miniatura 480w subida");
  }

  // 3. Actualizar tabla public.banners
  console.log("\n3. Actualizando tabla public.banners...");
  // Borrar banners existentes
  const { error: delErr } = await supabase.from("banners").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) console.warn("Aviso al limpiar banners anteriores:", delErr.message);

  const newBannersData = BANNERS_CONFIG.map((b) => ({
    id: b.id,
    imagen_url: `${supabaseUrl}/storage/v1/object/public/banners/${b.targetFileName}`,
    imagen_mobile_url: null,
    titulo: null,
    subtexto: null,
    cta_texto: null,
    cta_link: null,
    orden: b.orden,
    activo: true,
  }));

  const { data: inserted, error: insErr } = await supabase.from("banners").insert(newBannersData).select();
  if (insErr) throw insErr;

  console.log("✓ 3 banners insertados en base de datos:");
  for (const row of inserted) {
    console.log(`  - ID: ${row.id} | Orden: ${row.orden} | URL: ${row.imagen_url}`);
  }

  console.log("\n¡BANNERS CONFIGURADOS CON ÉXITO!");
}

main().catch(console.error);
