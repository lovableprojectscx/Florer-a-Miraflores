import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import sharp from "sharp";
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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
  console.error("Faltan credenciales de administración o API key en variables de entorno.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TESTIMONIOS_DATA = [
  {
    originalFile: "01_IMG_0004_Testimonio_4K.png",
    targetFile: "testimonio-01-claudia.webp",
    nombre: "Claudia M.",
    texto: "Le envié este hermoso arreglo a mi sobrina por su cumpleaños. La sorpresa fue total, los globos y las flores llegaron impecables.",
    estrellas: 5,
    fecha: "2026-09-18",
    fuente: "whatsapp",
    destacado: true,
    orden: 1,
  },
  {
    originalFile: "02_IMG_0005_Testimonio_4K.png",
    targetFile: "testimonio-02-valeria.webp",
    nombre: "Valeria S.",
    texto: "El detalle de las rosas rojas con el osito fue un éxito total. Entrega súper puntual en Miraflores. Muy recomendados.",
    estrellas: 5,
    fecha: "2026-09-22",
    fuente: "google",
    destacado: true,
    orden: 2,
  },
  {
    originalFile: "03_IMG_0011_Testimonio_4K.png",
    targetFile: "testimonio-03-camila.webp",
    nombre: "Camila R.",
    texto: "Los girasoles estaban fresquísimos y el arreglo era aún más grande de lo que se veía en la foto. Servicio A1.",
    estrellas: 5,
    fecha: "2026-09-25",
    fuente: "google",
    destacado: true,
    orden: 3,
  },
  {
    originalFile: "04_IMG_0012_Testimonio_4K.png",
    targetFile: "testimonio-04-patricia.webp",
    nombre: "Patricia G.",
    texto: "La combinación de girasoles con los Ferrero Rocher fue perfecta para alegrarle el día a mi mejor amiga. ¡Muchas gracias!",
    estrellas: 5,
    fecha: "2026-09-28",
    fuente: "whatsapp",
    destacado: false,
    orden: 4,
  },
  {
    originalFile: "05_IMG_0019_Testimonio_4K.png",
    targetFile: "testimonio-05-renzo.webp",
    nombre: "Renzo T.",
    texto: "Pedí un box para el cumpleaños de mi hermano. Llegó a la hora acordada y las flores duraron más de una semana frescas.",
    estrellas: 5,
    fecha: "2026-09-30",
    fuente: "directo",
    destacado: false,
    orden: 5,
  },
  {
    originalFile: "06_IMG_0022_Testimonio_4K.png",
    targetFile: "testimonio-06-rosaelena.webp",
    nombre: "Rosa Elena B.",
    texto: "Hermoso arreglo floral para mi mamá. La atención por WhatsApp fue muy amable y resolvieron mi pedido en el mismo día.",
    estrellas: 5,
    fecha: "2026-10-02",
    fuente: "google",
    destacado: true,
    orden: 6,
  },
  {
    originalFile: "07_IMG_0026_Testimonio_4K.png",
    targetFile: "testimonio-07-fiorella.webp",
    nombre: "Fiorella Z.",
    texto: "La presentación con el cajón secreto de chocolates es un 10 de 10. Mi pareja quedó encantada con el detalle.",
    estrellas: 5,
    fecha: "2026-10-04",
    fuente: "whatsapp",
    destacado: false,
    orden: 7,
  },
  {
    originalFile: "08_IMG_0028_Testimonio_4K.png",
    targetFile: "testimonio-08-gabriela.webp",
    nombre: "Gabriela P.",
    texto: "Puntualidad británica para nuestra celebración de aniversario. El espumante bien presentado y las flores radiantes.",
    estrellas: 5,
    fecha: "2026-10-06",
    fuente: "google",
    destacado: true,
    orden: 8,
  },
  {
    originalFile: "09_IMG_0036_Testimonio_4K.png",
    targetFile: "testimonio-09-jorge.webp",
    nombre: "Jorge L.",
    texto: "Le envié este detalle a mi esposo a su trabajo. Las hortensias azules espectaculares, llamó la atención de todos.",
    estrellas: 5,
    fecha: "2026-10-08",
    fuente: "whatsapp",
    destacado: false,
    orden: 9,
  },
  {
    originalFile: "10_IMG_0039_Testimonio_4K.png",
    targetFile: "testimonio-10-miguelangel.webp",
    nombre: "Miguel Ángel C.",
    texto: "Vivo fuera de Lima y pude enviar el regalo para el día de mi madre sin ningún inconveniente. Confiables al 100%.",
    estrellas: 5,
    fecha: "2026-10-09",
    fuente: "directo",
    destacado: false,
    orden: 10,
  },
  {
    originalFile: "11_IMG_0041_Testimonio_4K.png",
    targetFile: "testimonio-11-lucia.webp",
    nombre: "Lucía D.",
    texto: "Recogí mi pedido en tienda y el empaque boutique es finísimo. Te entregan todo listo y con tarjeta dedicatoria hermosa.",
    estrellas: 5,
    fecha: "2026-10-10",
    fuente: "google",
    destacado: false,
    orden: 11,
  },
  {
    originalFile: "12_IMG_0042_Testimonio_4K.png",
    targetFile: "testimonio-12-stephanie.webp",
    nombre: "Stephanie V.",
    texto: "Una sorpresa inolvidable en mi oficina. El florero rosado y los chocolates de corazón hicieron mi día súper especial.",
    estrellas: 5,
    fecha: "2026-10-11",
    fuente: "whatsapp",
    destacado: true,
    orden: 12,
  },
  {
    originalFile: "13_IMG_0065_Testimonio_4K.png",
    targetFile: "testimonio-13-andrea.webp",
    nombre: "Andrea K.",
    texto: "El box de rosas en forma de corazón es bellísimo. La sonrisa de mi amiga lo dijo todo. Excelente florería en Lima.",
    estrellas: 5,
    fecha: "2026-10-12",
    fuente: "google",
    destacado: false,
    orden: 13,
  },
  {
    originalFile: "14_WhatsApp_Image_2026-10-08_at_8.48.15_AM_Testimonio_4K.png",
    targetFile: "testimonio-14-lorena.webp",
    nombre: "Lorena H.",
    texto: "Hice el pedido para una cena especial y coordinaron con el restaurante para entregarlo en el momento exacto. ¡Mil gracias!",
    estrellas: 5,
    fecha: "2026-10-13",
    fuente: "directo",
    destacado: false,
    orden: 14,
  },
];

async function main() {
  console.log("=== INICIANDO PROCESAMIENTO DE TESTIMONIOS ===");

  // 1. Iniciar sesión como administrador
  console.log(`1. Autenticando como admin (${adminEmail})...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authErr) {
    throw new Error(`Error en autenticación: ${authErr.message}`);
  }
  console.log("   Autenticación exitosa.");

  // 2. Procesar y subir cada foto
  const sourceFolder = resolve(process.cwd(), "testimonio 4K");

  for (const item of TESTIMONIOS_DATA) {
    const inputPath = join(sourceFolder, item.originalFile);
    if (!existsSync(inputPath)) {
      console.warn(`   Archivo no encontrado: ${inputPath}`);
      continue;
    }

    console.log(`2. Procesando ${item.originalFile} -> ${item.targetFile}...`);
    // Optimizar a WebP a máximo 1200px de ancho/alto con calidad 85
    const webpBuffer = await sharp(inputPath)
      .resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    console.log(`   Optimizado: ${(webpBuffer.length / 1024).toFixed(1)} KB`);

    // Subir a Storage bucket 'testimonios'
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("testimonios")
      .upload(item.targetFile, webpBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadErr) {
      console.error(`   Error al subir ${item.targetFile}:`, uploadErr.message);
      throw uploadErr;
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from("testimonios")
      .getPublicUrl(item.targetFile);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`   URL pública: ${publicUrl}`);

    // Insertar en la tabla testimonios
    const { data: insertData, error: insertErr } = await supabase
      .from("testimonios")
      .insert({
        nombre: item.nombre,
        texto: item.texto,
        estrellas: item.estrellas,
        fecha: item.fecha,
        fuente: item.fuente,
        imagen_url: publicUrl,
        destacado: item.destacado,
        orden: item.orden,
        activo: true,
      })
      .select();

    if (insertErr) {
      console.error(`   Error al insertar en testimonios:`, insertErr.message);
      throw insertErr;
    }

    console.log(`   Testimonio registrado para "${item.nombre}" (ID: ${insertData[0].id})`);
  }

  // 3. Activar franja en public.config
  console.log("3. Actualizando configuración del Home (mostrar_resenas_home = true)...");
  const { error: configErr } = await supabase
    .from("config")
    .update({
      mostrar_resenas_home: true,
      google_rating: 4.9,
      google_reviews_count: 128,
    })
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Actualiza la fila de config

  if (configErr) {
    console.error("   Error actualizando config:", configErr.message);
  } else {
    console.log("   Configuración actualizada exitosamente.");
  }

  console.log("=== PROCESAMIENTO COMPLETADO CON ÉXITO ===");
}

main().catch((err) => {
  console.error("Fallo general:", err);
  process.exit(1);
});
