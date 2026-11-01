import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sdrkiomeesoctsxeidmu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcmtpb21lZXNvY3RzeGVpZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjE3MzAsImV4cCI6MjA5NDczNzczMH0.PSWFG95ZjsabOTNnOLf1CkA035H7tU3EwSNnEAYy0u8";

const adminEmail = "pedidos@floreriamiraflores.com";
const adminPassword = "idenza.site";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MAPA_IMAGENES = [
  // 1. Nacimientos
  {
    slug: "nacimientos-nino",
    file: "1791253776800-iqb4gsutko.webp",
    titulo: "Bouquet Bienvenida al Mundo Niño (celeste/blanco recién nacido)",
  },
  {
    slug: "nacimientos-nina",
    file: "1791156544264-l4skuzzh9b9.webp",
    titulo: "Arreglo Ensueño Infantil con Muñequita (rosa pastel recién nacida)",
  },

  // 2. Tulipanes
  {
    slug: "tulipanes-arreglos",
    file: "1791313097295-12-28hte8x.webp",
    titulo: "Box Blanco Tulipanes Fucsia & Follaje Fresco",
  },
  {
    slug: "tulipanes-ramos",
    file: "1791313092054-7-kseriz6.webp",
    titulo: "Bouquet Floral Tulipanes Amarillos Radiantes",
  },
  {
    slug: "tulipanes-floreros",
    file: "pack5_4k_115_115_IMG_3766_Estudio.webp",
    titulo: "Jarrón Primavera Radiante Silvestre",
  },
  {
    slug: "tulipanes",
    file: "1791313096165-11-l8j3j2c.webp",
    titulo: "Box Negro Tulipanes Bicolor Fucsia y Naranja",
  },

  // 3. Arreglos Florales
  {
    slug: "box-luxury",
    file: "prod_4k_010_02_K_Estudio_4K.webp",
    titulo: "Box Velvet Luxury",
  },
  {
    slug: "ramos",
    file: "1791156499751-vy2mgps6o8.webp",
    titulo: "Bouquet Pasión Radiante de Rosas Rojas",
  },
  {
    slug: "orquideasparaprom",
    file: "1791156482814-byr3oarcmf.webp",
    titulo: "Orquídea Phalaenopsis Magenta Deluxe",
  },
  {
    slug: "arreglos-blancos",
    file: "1791156556714-loteiqb2qab.webp",
    titulo: "Bouquet Serenata de Lirios Blancos",
  },
  {
    slug: "azul",
    file: "1791313106296-21-lg3pzfh.webp",
    titulo: "Bouquet Nube Silvestre Gipsófila Celeste & Lavanda",
  },
  {
    slug: "arreglos-premium",
    file: "1791253630826-2x6tjy21j5c.webp",
    titulo: "Emperatriz",
  },
  {
    slug: "detalle",
    file: "1791156583858-whfuoroso4.webp",
    titulo: "Bouquet Lavanda Dulzura & Rosas Lila",
  },
  {
    slug: "centro-de-mesa",
    file: "pack5_4k_047_47_IMG_0754_Estudio_.webp",
    titulo: "Centro de Mesa Banquete Gala",
  },
  {
    slug: "arreglos-florales",
    file: "prod-157-arreglo-editorial-flores-de-ensueno.webp",
    titulo: "Arreglo Editorial Flores de Ensueño",
  },

  // 4. Ocasión
  {
    slug: "cumpleanos",
    file: "1790275666930-yfcle3b856.webp",
    titulo: "Bouquet de Globos Happy Birthday Rose Gold",
  },
  {
    slug: "para-el",
    file: "1791253733889-bc9whv0dlbp.webp",
    titulo: "Marcial (elegancia masculina)",
  },
  {
    slug: "centros-de-mesa",
    file: "pack5_4k_040_40_IMG_0706_Estudio_.webp",
    titulo: "Centro de Mesa Gala Banquete",
  },
  {
    slug: "jarrones",
    file: "1791156570394-osppl9bqo1h.webp",
    titulo: "Cristal (arreglo en jarrón alto de vidrio)",
  },
  {
    slug: "mejorate",
    file: "1791253643660-r6mewlhuybs.webp",
    titulo: "Canasta Girasoles & Margaritas Amarillas",
  },
  {
    slug: "ocasion",
    file: "1791156474226-0qhwsltb5eao.webp",
    titulo: "Atardecer",
  },

  // 5. Primaverales
  {
    slug: "girasoles",
    file: "1791156580844-o6v4btnji5p.webp",
    titulo: "Box Luxury Noir de Girasoles Radiantes",
  },
  {
    slug: "primaverales",
    file: "1791156525145-he9415t9tv9.webp",
    titulo: "Canasta Girasoles & Oso LOVE Deluxe",
  },

  // 6. Complementos
  {
    slug: "globos",
    file: "1790275669691-p8qdphgztxf.webp",
    titulo: "Bouquet Celebración & Corazones Deluxe",
  },
  {
    slug: "chocolates",
    file: "pack5_4k_023_23_dd770f02_Estudio_.webp",
    titulo: "Chocolate Fino Gourmet",
  },
  {
    slug: "peluches",
    file: "1791156575192-d1fxtl8to25.webp",
    titulo: "Box Dorado con Rosas Amarillas & Peluche",
  },
  {
    slug: "toppers",
    file: "1790275677561-o9fwq493n7d.webp",
    titulo: "Estrella Magenta",
  },
  {
    slug: "licores",
    file: "1791313116080-30-16l217l.webp",
    titulo: "Taza Canasta con Licor Fino & Dulces",
  },
  {
    slug: "complementos",
    file: "1790275672267-pxsugrf01b.webp",
    titulo: "Ramillete de Corazones Pasión Metálicos",
  },

  // 7. Condolencias
  {
    slug: "mantos",
    file: "prod-335-corona-solemne-flores-blancas.webp",
    titulo: "Corona Solemne Flores Blancas (manto funerario de rosas y lirios)",
  },

  // 8. Colecciones Adicionales
  {
    slug: "flores-amarillas",
    file: "1791313113053-28-qtumwqu.webp",
    titulo: "Box White Minimalist Rosas Amarillas Luminosas",
  },
  {
    slug: "orquideas-fiesta-prom",
    file: "1791156481337-opot2ry5mm8.webp",
    titulo: "Orquídea Phalaenopsis Amarilla Sol",
  },
  {
    slug: "navidad",
    file: "1791253769105-066xlaejuto9.webp",
    titulo: "Ramo Imperial de Rosas Carmesí",
  },
];

async function main() {
  console.log("==================================================================");
  console.log("  ASIGNACIÓN DE IMÁGENES CARACTERÍSTICAS PARA CATEGORÍAS/SUBCATS  ");
  console.log("==================================================================");

  // 1. Autenticar Admin
  console.log("\n1. Autenticando admin en Supabase...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;
  console.log("✓ Admin autenticado:", auth.user.email);

  // 2. Verificar o generar miniaturas thumbs/960
  console.log("\n2. Verificando y optimizando thumbs/960...");

  for (const item of MAPA_IMAGENES) {
    const thumbUrl = `${supabaseUrl}/storage/v1/object/public/productos/thumbs/960/${item.file}`;
    const resThumb = await fetch(thumbUrl, { method: "HEAD" });

    if (resThumb.status !== 200) {
      console.log(`   Generando miniatura thumbs/960 para: ${item.file}...`);
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/productos/${item.file}`;
      const imgRes = await fetch(publicUrl);
      if (!imgRes.ok) throw new Error(`No se pudo descargar ${publicUrl}`);
      const arrayBuffer = await imgRes.arrayBuffer();
      const bufOriginal = Buffer.from(arrayBuffer);

      const buf960 = await sharp(bufOriginal)
        .resize(960, 960, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const { error: upErr } = await supabase.storage
        .from("productos")
        .upload(`thumbs/960/${item.file}`, buf960, {
          contentType: "image/webp",
          cacheControl: "max-age=31536000, public",
          upsert: true,
        });

      if (upErr) throw upErr;
      console.log(`   ✓ Subida miniatura 960: thumbs/960/${item.file}`);
    }
  }

  // 3. Actualizar imagen_url en la tabla 'categorias'
  console.log("\n3. Actualizando imagen_url en la base de datos Supabase...");

  for (const item of MAPA_IMAGENES) {
    const finalUrl = `${supabaseUrl}/storage/v1/object/public/productos/thumbs/960/${item.file}`;
    const { error: updErr } = await supabase
      .from("categorias")
      .update({ imagen_url: finalUrl })
      .eq("slug", item.slug);

    if (updErr) {
      console.error(`   ❌ Error actualizando ${item.slug}:`, updErr.message);
    } else {
      console.log(`   ✓ [${item.slug}] -> ${item.titulo}`);
    }
  }

  // 4. Verificación final de estado en la base de datos
  console.log("\n4. Verificación final de cobertura en tabla 'categorias':");
  const { data: todasCats } = await supabase.from("categorias").select("*").order("orden");
  const sinFoto = todasCats.filter((c) => !c.imagen_url);

  console.log(`\nTotal categorías: ${todasCats.length}`);
  console.log(`Con imagen: ${todasCats.filter((c) => Boolean(c.imagen_url)).length}`);
  console.log(`Sin imagen restante: ${sinFoto.length}`);

  if (sinFoto.length > 0) {
    console.log("Categorías restantes sin imagen:", sinFoto.map((c) => c.slug));
  } else {
    console.log("✨ ¡100% de categorías y subcategorías cuentan con imagen de portada!");
  }

  console.log("==================================================================");
  console.log("  ¡PROCESO FINALIZADO CON ÉXITO!");
  console.log("==================================================================");
}

main().catch(console.error);
