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

async function main() {
  console.log("Autenticando admin en Supabase...");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authErr) throw authErr;
  console.log("Admin autenticado:", authData.user.id);

  const bannerPath = resolve(process.cwd(), "src/assets/hero-flowers.webp");
  const bannerBuffer = readFileSync(bannerPath);

  // 1. Subir original
  console.log("Subiendo original banners/banner-principal.webp...");
  const { error: errOrig } = await supabase.storage
    .from("banners")
    .upload("banner-principal.webp", bannerBuffer, {
      contentType: "image/webp",
      upsert: true,
    });
  if (errOrig) console.error("Error original:", errOrig.message);
  else console.log("✓ Original subido exitosamente");

  // 2. Generar y subir miniatura 960w
  console.log("Generando miniatura 960w...");
  const thumb960 = await sharp(bannerBuffer)
    .resize({ width: 960, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const { error: err960 } = await supabase.storage
    .from("banners")
    .upload("thumbs/960/banner-principal.webp", thumb960, {
      contentType: "image/webp",
      upsert: true,
    });
  if (err960) console.error("Error 960w:", err960.message);
  else console.log("✓ Miniatura 960w subida");

  // 3. Generar y subir miniatura 480w
  console.log("Generando miniatura 480w...");
  const thumb480 = await sharp(bannerBuffer)
    .resize({ width: 480, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const { error: err480 } = await supabase.storage
    .from("banners")
    .upload("thumbs/480/banner-principal.webp", thumb480, {
      contentType: "image/webp",
      upsert: true,
    });
  if (err480) console.error("Error 480w:", err480.message);
  else console.log("✓ Miniatura 480w subida");

  console.log("¡Banners configurados correctamente!");
}

main().catch(console.error);
