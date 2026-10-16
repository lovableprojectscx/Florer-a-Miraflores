import { readFileSync, existsSync } from "node:fs";
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

const viteEnv = loadEnv("", process.cwd(), "");
const e2eEnv = parseEnvFile(resolve(process.cwd(), ".env.e2e.local"));
const localEnv = parseEnvFile(resolve(process.cwd(), ".env.local"));

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  localEnv.VITE_SUPABASE_URL ||
  e2eEnv.VITE_SUPABASE_URL ||
  viteEnv.VITE_SUPABASE_URL ||
  "https://sdrkiomeesoctsxeidmu.supabase.co";

const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  localEnv.VITE_SUPABASE_ANON_KEY ||
  e2eEnv.VITE_SUPABASE_ANON_KEY;

const adminEmail = process.env.E2E_ADMIN_EMAIL || e2eEnv.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD || e2eEnv.E2E_ADMIN_PASSWORD;

if (!supabaseAnonKey || !adminEmail || !adminPassword) {
  console.error("Faltan credenciales de administración.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = "testimonios";
const NUM_RECUERDOS = 14;

async function main() {
  console.log("Iniciando sesión como admin...");
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authErr) {
    console.error("Error al autenticar:", authErr.message);
    process.exit(1);
  }
  console.log("Sesión iniciada correctamente.");

  for (let i = 1; i <= NUM_RECUERDOS; i++) {
    const num = String(i).padStart(2, "0");
    const fileName = `recuerdo-${num}.webp`;
    console.log(`\nProcesando ${fileName}...`);

    // Descargar imagen original
    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(fileName);
    if (dlErr || !blob) {
      console.error(`Error al descargar ${fileName}:`, dlErr?.message);
      continue;
    }

    const inputBuffer = Buffer.from(await blob.arrayBuffer());

    // Generar miniatura 480w
    const thumb480Buffer = await sharp(inputBuffer)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    // Generar miniatura 960w
    const thumb960Buffer = await sharp(inputBuffer)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const path480 = `thumbs/480/${fileName}`;
    const path960 = `thumbs/960/${fileName}`;

    // Subir 480
    const { error: upErr480 } = await supabase.storage
      .from(BUCKET)
      .upload(path480, thumb480Buffer, {
        contentType: "image/webp",
        upsert: true,
      });
    if (upErr480) {
      console.error(`Error subiendo ${path480}:`, upErr480.message);
    } else {
      console.log(`OK subido: ${path480} (${thumb480Buffer.length} bytes)`);
    }

    // Subir 960
    const { error: upErr960 } = await supabase.storage
      .from(BUCKET)
      .upload(path960, thumb960Buffer, {
        contentType: "image/webp",
        upsert: true,
      });
    if (upErr960) {
      console.error(`Error subiendo ${path960}:`, upErr960.message);
    } else {
      console.log(`OK subido: ${path960} (${thumb960Buffer.length} bytes)`);
    }
  }

  console.log("\nMiniaturas generadas y subidas con éxito a bucket testimonios.");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
