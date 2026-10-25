import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
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

const RECUERDOS_DATA = [
  {
    num: "01",
    file: "01_IMG_0004_Testimonio_4K.png",
    slug: "sorpresa-cumpleanos-globos-flores",
    titulo: "Sorpresa de Cumpleaños con Globos y Flores",
    resumen: "Entrega especial llena de alegría con globos festivos y flores de temporada.",
  },
  {
    num: "02",
    file: "02_IMG_0005_Testimonio_4K.png",
    slug: "detalle-rosas-rojas-peluche-aniversario",
    titulo: "Detalle de Rosas Rojas y Peluche para Aniversario",
    resumen: "Un clásico romántico con rosas de exportación y un tierno oso de peluche.",
  },
  {
    num: "03",
    file: "03_IMG_0011_Testimonio_4K.png",
    slug: "ramo-rosas-follaje-silvestre",
    titulo: "Ramo de Rosas y Follaje Silvestre",
    resumen: "Composición fresca y natural en tonos vivos para alegrar el día.",
  },
  {
    num: "04",
    file: "04_IMG_0012_Testimonio_4K.png",
    slug: "canasta-floral-rosas-gerberas-cumpleanos",
    titulo: "Canasta Floral de Rosas y Gerberas de Cumpleaños",
    resumen: "Arreglo artesanal en canasta con gerberas y rosas seleccionadas.",
  },
  {
    num: "05",
    file: "05_IMG_0019_Testimonio_4K.png",
    slug: "arreglo-especial-cumpleanos-para-el",
    titulo: "Arreglo Especial de Cumpleaños Para Él",
    resumen: "Diseño elegante con toques sobrios y flores importadas de alta durabilidad.",
  },
  {
    num: "06",
    file: "06_IMG_0022_Testimonio_4K.png",
    slug: "bouquet-romantico-rosas-rojas-exportacion",
    titulo: "Bouquet Romántico de Rosas Rojas de Exportación",
    resumen: "Rosas rojas premium envueltas en papel fino con lazo de seda.",
  },
  {
    num: "07",
    file: "07_IMG_0026_Testimonio_4K.png",
    slug: "box-luxury-rosas-chocolates",
    titulo: "Box Luxury con Rosas y Chocolates",
    resumen: "Caja de diseño exclusivo con gaveta secreta de chocolates finos.",
  },
  {
    num: "08",
    file: "08_IMG_0028_Testimonio_4K.png",
    slug: "ramo-primaveral-multicolor-celebracion",
    titulo: "Ramo Primaveral Multicolor de Celebración",
    resumen: "Explosión de colores y aromas para conmemorar una fecha inolvidable.",
  },
  {
    num: "09",
    file: "09_IMG_0036_Testimonio_4K.png",
    slug: "detalle-floral-felicitaciones-para-el",
    titulo: "Detalle Floral de Felicitaciones Para Él",
    resumen: "Hortensias y follaje distinguido entregado directamente en oficina.",
  },
  {
    num: "10",
    file: "10_IMG_0039_Testimonio_4K.png",
    slug: "centro-floral-agradecimiento-afecto",
    titulo: "Centro Floral de Agradecimiento y Afecto",
    resumen: "Flores blancas y tonos pastel para expresar gratitud sincera.",
  },
  {
    num: "11",
    file: "11_IMG_0041_Testimonio_4K.png",
    slug: "ramo-graduacion-globo-exitos",
    titulo: "Ramo de Graduación con Globo de Éxitos",
    resumen: "Presentación impecable con globo metalizado para celebrar el logro académico.",
  },
  {
    num: "12",
    file: "12_IMG_0042_Testimonio_4K.png",
    slug: "florero-romantico-rosas-dedicatoria",
    titulo: "Florero Romántico de Rosas con Dedicatoria",
    resumen: "Florero de vidrio con rosas rosadas frescas y tarjeta artesanal personalizada.",
  },
  {
    num: "13",
    file: "13_IMG_0065_Testimonio_4K.png",
    slug: "bouquet-primaveral-cumpleanos",
    titulo: "Bouquet Primaveral de Cumpleaños",
    resumen: "Diseño en forma de corazón con rosas de temporada en tono pastel.",
  },
  {
    num: "14",
    file: "14_WhatsApp_Image_2026-10-08_at_8.48.15_AM_Testimonio_4K.png",
    slug: "box-floral-rosas-elegancia-suprema",
    titulo: "Box Floral de Rosas Elegancia Suprema",
    resumen: "Entrega coordinada con reserva para una cena inolvidable en Lima.",
  },
];

async function main() {
  console.log("Autenticando admin...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;

  const sourceFolder = resolve(process.cwd(), "testimonio 4K");

  for (let i = 0; i < RECUERDOS_DATA.length; i++) {
    const item = RECUERDOS_DATA[i];
    const targetFile = `recuerdo-${item.num}.webp`;
    const inputPath = join(sourceFolder, item.file);

    if (!existsSync(inputPath)) {
      console.warn(`Archivo no encontrado: ${inputPath}`);
      continue;
    }

    console.log(`\nProcesando ${item.file} -> ${targetFile}...`);
    const originalBuffer = await sharp(inputPath)
      .resize({ width: 1200, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // 1. Subir original recuerdo-XX.webp
    await supabase.storage.from("testimonios").upload(targetFile, originalBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

    // 2. Subir miniatura 960w
    const thumb960 = await sharp(originalBuffer)
      .resize({ width: 960, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    await supabase.storage
      .from("testimonios")
      .upload(`thumbs/960/${targetFile}`, thumb960, { contentType: "image/webp", upsert: true });

    // 3. Subir miniatura 480w
    const thumb480 = await sharp(originalBuffer)
      .resize({ width: 480, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    await supabase.storage
      .from("testimonios")
      .upload(`thumbs/480/${targetFile}`, thumb480, { contentType: "image/webp", upsert: true });

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/testimonios/${targetFile}`;

    console.log(`Insertando recuerdo: ${item.titulo}...`);
    const { error: insErr } = await supabase.from("recuerdos").upsert(
      {
        slug: item.slug,
        titulo: item.titulo,
        resumen: item.resumen,
        contenido: item.resumen,
        imagen_portada_url: publicUrl,
        autor: "Florería Miraflores",
        publicado: true,
        fecha_publicacion: new Date(Date.now() - (14 - i) * 86400000).toISOString(),
        destacado: i < 4,
        orden: i + 1,
      },
      { onConflict: "slug" },
    );

    if (insErr) console.error(`Error en recuerdo ${item.slug}:`, insErr.message);
    else console.log(`✓ Recuerdo ${item.slug} listo.`);
  }

  console.log("\n¡14 Recuerdos sembrados con éxito!");
}

main().catch(console.error);
