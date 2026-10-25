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

const BASE_PRODUCTS = [
  {
    nombre: "Velvet Box Deluxe",
    precio: 220,
    descripcion:
      "Nuestro arreglo estrella en caja aterciopelada negra con rosas importadas y follaje exótico. Una pieza que impacta desde el primer vistazo.",
    catSlug: "cumpleanos",
    tags: ["mas_vendido", "edicion_limitada"],
    imageAsset: "product-novedad-velvet.webp",
    orden: 1,
  },
  {
    nombre: "Box Romántico de Rosas",
    precio: 150,
    descripcion:
      "Una selección de flores frescas de temporada presentadas en una caja artesanal. Ideal para sorprender en aniversarios y fechas especiales. Incluye tarjeta de dedicatoria.",
    catSlug: "amor-aniversario",
    tags: ["mas_vendido"],
    imageAsset: "product-box-romantico.webp",
    orden: 2,
  },
  {
    nombre: "Aurora Silvestre",
    precio: 165,
    descripcion:
      "Composición en tonos pastel con flores silvestres y rosas blancas. Frescura y elegancia en cada tallo.",
    catSlug: "cumpleanos",
    tags: ["novedad"],
    imageAsset: "product-novedad-aurora.webp",
    orden: 3,
  },
  {
    nombre: "Pampas & Bienvenida",
    precio: 130,
    descripcion:
      "Arreglo delicado con pampas, flores blancas y detalles en eucalipto. Perfecto para dar la bienvenida a la nueva vida.",
    catSlug: "nacimientos",
    tags: ["novedad"],
    imageAsset: "product-novedad-pampas.webp",
    orden: 4,
  },
  {
    nombre: "Ramo Primavera Vibrante",
    precio: 85,
    descripcion:
      "Ramo colorido con flores de temporada: girasoles, lirios y follaje verde. Un clásico que nunca pasa de moda.",
    catSlug: "ramos",
    tags: ["mas_vendido"],
    imageAsset: "product-ramo-primavera.webp",
    orden: 5,
  },
  {
    nombre: "Arreglo Especial Florero",
    precio: 120,
    descripcion:
      "Composición floral en florero de vidrio con rosas, astromelias y flores silvestres. Listo para colocar en casa u oficina.",
    catSlug: "ramos",
    tags: [],
    imageAsset: "product-arreglo-especial.webp",
    orden: 6,
  },
  {
    nombre: "Box Sorpresa con Chocolates",
    precio: 130,
    descripcion:
      "Combinación sorpresa de flores frescas de temporada en caja especial con chocolates artesanales.",
    catSlug: "box-chocolates",
    tags: ["oferta"],
    imageAsset: "product-box-sorpresa.webp",
    orden: 7,
  },
  {
    nombre: "Ramo de Tulipanes Holandeses",
    precio: 180,
    descripcion:
      "Tulipanes importados frescos de primera selección, acompañados de follaje delicado.",
    catSlug: "tulipanes",
    tags: ["novedad"],
    imageAsset: "product-tulipanes.webp",
    orden: 8,
  },
  {
    nombre: "Corona Fúnebre Imperial",
    precio: 250,
    descripcion:
      "Corona floral de respeto y distinción elaborada con flores blancas y follaje fino.",
    catSlug: "defuncion",
    tags: [],
    imageAsset: "product-corona.webp",
    orden: 9,
  },
  {
    nombre: "Bouquet Novia Eterna",
    precio: 210,
    descripcion:
      "Diseño nupcial exclusivo con flores preservadas y detalles artesanales para un día inolvidable.",
    catSlug: "amor-aniversario",
    tags: ["edicion_limitada"],
    imageAsset: "product-novia-eterna.webp",
    orden: 10,
  },
];

async function main() {
  console.log("Autenticando admin...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;

  // Obtener categorías para mapear IDs
  const { data: cats, error: catErr } = await supabase.from("categorias").select("id, slug");
  if (catErr) throw catErr;
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));

  for (const prod of BASE_PRODUCTS) {
    const catId = catMap.get(prod.catSlug);
    const assetPath = resolve(process.cwd(), "src/assets", prod.imageAsset);
    const buffer = readFileSync(assetPath);
    const fileName = `${prod.imageAsset}`;

    console.log(`Subiendo imagen para ${prod.nombre}...`);
    // 1. Original
    await supabase.storage.from("productos").upload(fileName, buffer, {
      contentType: "image/webp",
      upsert: true,
    });

    // 2. 960w
    const t960 = await sharp(buffer)
      .resize({ width: 960, height: 960, fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
    await supabase.storage.from("productos").upload(`thumbs/960/${fileName}`, t960, {
      contentType: "image/webp",
      upsert: true,
    });

    // 3. 480w
    const t480 = await sharp(buffer)
      .resize({ width: 480, height: 480, fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();
    await supabase.storage.from("productos").upload(`thumbs/480/${fileName}`, t480, {
      contentType: "image/webp",
      upsert: true,
    });

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/productos/${fileName}`;

    console.log(`Insertando producto: ${prod.nombre}...`);
    const { error: insErr } = await supabase.from("productos").insert({
      nombre: prod.nombre,
      precio: prod.precio,
      descripcion: prod.descripcion,
      categoria_id: catId || null,
      tags: prod.tags,
      imagenes: [publicUrl],
      activo: true,
      orden: prod.orden,
    });

    if (insErr) console.error(`Error insertando ${prod.nombre}:`, insErr.message);
    else console.log(`✓ Insertado: ${prod.nombre}`);
  }

  console.log("\n¡Catálogo base sembrado con éxito!");
}

main().catch(console.error);
