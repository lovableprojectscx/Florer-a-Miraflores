import { readFileSync } from "node:fs";
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

const CATEGORIAS_MAP = [
  { slug: "amor-aniversario", file: "product-box-romantico.webp" },
  { slug: "cumpleanos", file: "product-arreglo-especial.webp" },
  { slug: "nacimientos", file: "product-novedad-aurora.webp" },
  { slug: "tulipanes", file: "product-tulipanes.webp" },
  { slug: "arreglos-florales", file: "product-novedad-velvet.webp" },
  { slug: "primaverales", file: "product-ramo-primavera.webp" },
  { slug: "ramos", file: "product-ramo-primavera.webp" },
  { slug: "girasoles", file: "product-ramo-primavera.webp" },
  { slug: "defuncion", file: "product-corona.webp" },
  { slug: "ofertas", file: "product-box-sorpresa.webp" },
  { slug: "arreglos-premium", file: "product-novedad-velvet.webp" },
];

async function main() {
  console.log("Autenticando admin en Supabase...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authErr) throw authErr;
  console.log("Admin autenticado:", authData.user.id);

  for (const item of CATEGORIAS_MAP) {
    const filePath = resolve(process.cwd(), "src/assets", item.file);
    const buffer = readFileSync(filePath);
    const fileName = `${item.slug}.webp`;

    console.log(`Procesando categoría: ${item.slug} (${item.file})...`);

    // 1. Subir original
    const { error: errOrig } = await supabase.storage.from("categorias").upload(fileName, buffer, {
      contentType: "image/webp",
      upsert: true,
    });
    if (errOrig) console.error(`  Error subiendo original ${fileName}:`, errOrig.message);

    // 2. Miniatura 960w
    const thumb960 = await sharp(buffer)
      .resize({ width: 960, height: 960, fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
    await supabase.storage.from("categorias").upload(`thumbs/960/${fileName}`, thumb960, {
      contentType: "image/webp",
      upsert: true,
    });

    // 3. Miniatura 480w
    const thumb480 = await sharp(buffer)
      .resize({ width: 480, height: 480, fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
    await supabase.storage.from("categorias").upload(`thumbs/480/${fileName}`, thumb480, {
      contentType: "image/webp",
      upsert: true,
    });

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/categorias/${fileName}`;

    // Actualizar BD
    const { error: dbErr } = await supabase
      .from("categorias")
      .update({ imagen_url: publicUrl })
      .eq("slug", item.slug);

    if (dbErr) console.error(`  Error actualizando BD para ${item.slug}:`, dbErr.message);
    else console.log(`  ✓ ${item.slug} actualizada con ${publicUrl}`);
  }

  console.log("\n¡Todas las categorías han sido enriquecidas con imágenes HD!");
}

main().catch(console.error);
