import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

const e2eEnv = parseEnvFile(resolve(process.cwd(), ".env.e2e.local"));
const localEnv = parseEnvFile(resolve(process.cwd(), ".env.local"));

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  localEnv.VITE_SUPABASE_URL ||
  e2eEnv.VITE_SUPABASE_URL ||
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

const RENAMES = [
  { oldName: "testimonio-01-claudia.webp", newName: "recuerdo-01.webp" },
  { oldName: "testimonio-02-valeria.webp", newName: "recuerdo-02.webp" },
  { oldName: "testimonio-03-camila.webp", newName: "recuerdo-03.webp" },
  { oldName: "testimonio-04-patricia.webp", newName: "recuerdo-04.webp" },
  { oldName: "testimonio-05-renzo.webp", newName: "recuerdo-05.webp" },
  { oldName: "testimonio-06-rosaelena.webp", newName: "recuerdo-06.webp" },
  { oldName: "testimonio-07-fiorella.webp", newName: "recuerdo-07.webp" },
  { oldName: "testimonio-08-gabriela.webp", newName: "recuerdo-08.webp" },
  { oldName: "testimonio-09-jorge.webp", newName: "recuerdo-09.webp" },
  { oldName: "testimonio-10-miguelangel.webp", newName: "recuerdo-10.webp" },
  { oldName: "testimonio-11-lucia.webp", newName: "recuerdo-11.webp" },
  { oldName: "testimonio-12-stephanie.webp", newName: "recuerdo-12.webp" },
  { oldName: "testimonio-13-andrea.webp", newName: "recuerdo-13.webp" },
  { oldName: "testimonio-14-lorena.webp", newName: "recuerdo-14.webp" },
];

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

  for (const { oldName, newName } of RENAMES) {
    console.log(`Procesando ${oldName} -> ${newName}...`);
    const { error: moveErr } = await supabase.storage.from("testimonios").move(oldName, newName);

    if (moveErr) {
      console.warn(`Aviso al mover ${oldName}:`, moveErr.message);
    } else {
      console.log(`OK: Mover en Storage ${oldName} -> ${newName}`);
    }

    const oldUrl = `${supabaseUrl}/storage/v1/object/public/testimonios/${oldName}`;
    const newUrl = `${supabaseUrl}/storage/v1/object/public/testimonios/${newName}`;

    const { data: updated, error: dbErr } = await supabase
      .from("recuerdos")
      .update({ imagen_portada_url: newUrl })
      .eq("imagen_portada_url", oldUrl)
      .select("id, titulo, imagen_portada_url");

    if (dbErr) {
      console.error(`Error actualizando DB para ${newName}:`, dbErr.message);
    } else {
      console.log(`DB actualizada para ${newName}:`, updated?.length, "registros.");
    }
  }

  console.log("Finalizado proceso de renombramiento.");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
