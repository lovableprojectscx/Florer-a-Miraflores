import amor from "@/assets/product-box-romantico.webp";
import arreglos from "@/assets/product-arreglo-especial.webp";
import premium from "@/assets/product-novedad-velvet.webp";
import tulipanes from "@/assets/product-tulipanes.webp";
import primaverales from "@/assets/product-ramo-primavera.webp";
import defuncion from "@/assets/product-corona.webp";
import ofertas from "@/assets/product-box-sorpresa.webp";

// Imports para productos individuales
import imgVelvet from "@/assets/product-novedad-velvet.webp";
import imgAurora from "@/assets/product-novedad-aurora.webp";
import imgPampas from "@/assets/product-novedad-pampas.webp";
import imgRomantico from "@/assets/product-box-romantico.webp";
import imgSorpresa from "@/assets/product-box-sorpresa.webp";
import imgPrimavera from "@/assets/product-ramo-primavera.webp";
import imgArreglo from "@/assets/product-arreglo-especial.webp";
import imgTulipanes from "@/assets/product-tulipanes.webp";
import imgCorona from "@/assets/product-corona.webp";
import imgNoviaNoviaEterna from "@/assets/product-novia-eterna.webp";
import imgNoviaJardin from "@/assets/product-novia-jardin.webp";
import imgNoviaMinimal from "@/assets/product-novia-minimal.webp";

export type Subcategory = { slug: string; name: string };
export type Category = {
  slug: string;
  name: string;
  tagline: string;
  img: string;
  subs: Subcategory[];
};

export const catalog: Category[] = [
  {
    slug: "ocasion",
    name: "Ocasión",
    tagline: "Para cada momento que merece flores.",
    img: amor,
    subs: [
      { slug: "amor-aniversario", name: "Amor / Aniversario" },
      { slug: "cumpleanos", name: "Cumpleaños" },
      { slug: "graduacion", name: "Graduación" },
      { slug: "nacimientos", name: "Nacimientos" },
      { slug: "para-el", name: "Para Él" },
    ],
  },
  {
    slug: "arreglos-florales",
    name: "Arreglos Florales",
    tagline: "Box, ramos y composiciones únicas.",
    img: arreglos,
    subs: [
      { slug: "box-luxury", name: "Box Luxury" },
      { slug: "box-chocolates", name: "Box con Chocolates" },
      { slug: "inauguracion", name: "Inauguración" },
      { slug: "ramos", name: "Ramos" },
      { slug: "bonsais", name: "Bonsais" },
    ],
  },
  {
    slug: "arreglos-premium",
    name: "Arreglos Premium",
    tagline: "Nuestra línea de autor.",
    img: premium,
    subs: [],
  },
  {
    slug: "tulipanes",
    name: "Tulipanes",
    tagline: "Importados, frescos cada semana.",
    img: tulipanes,
    subs: [
      { slug: "arreglos", name: "Arreglos" },
      { slug: "ramos", name: "Ramos" },
      { slug: "floreros", name: "Floreros" },
    ],
  },
  {
    slug: "primaverales",
    name: "Primaverales",
    tagline: "Color y luz para alegrar el día.",
    img: primaverales,
    subs: [{ slug: "girasoles", name: "Girasoles" }],
  },
  {
    slug: "defuncion",
    name: "Defunción",
    tagline: "Acompañamos con respeto y delicadeza.",
    img: defuncion,
    subs: [
      { slug: "coronas-funebres", name: "Coronas Fúnebres" },
      { slug: "cruces", name: "Cruces" },
      { slug: "lagrima-pedestal", name: "Lágrima con Pedestal" },
      { slug: "lagrimas", name: "Lágrimas" },
      { slug: "mantos", name: "Mantos" },
    ],
  },
  {
    slug: "ofertas",
    name: "Ofertas",
    tagline: "Promociones de temporada.",
    img: ofertas,
    subs: [],
  },
];

export const getCategory = (slug: string) => catalog.find((c) => c.slug === slug);

export const getSubcategory = (catSlug: string, subSlug: string) => {
  const c = getCategory(catSlug);
  return c?.subs.find((s) => s.slug === subSlug);
};

// ─── Productos ────────────────────────────────────────────────────────────────

export type ProductTag = "novedad" | "mas_vendido" | "edicion_limitada" | "oferta";

export interface Product {
  id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  imagenes: string[];
  /** slug de la subcategoría (o categoría padre para Premium/Ofertas) */
  categoria_id: string;
  /** slug de la categoría padre — para breadcrumb y relacionados */
  parent_id: string;
  tags: ProductTag[];
  activo: boolean;
}

export const products: Product[] = [
  // ── Ocasión / Amor-Aniversario
  {
    id: "box-romantico",
    nombre: "Box Romántico",
    precio: 150,
    descripcion:
      "Una selección de flores frescas de temporada presentadas en una caja artesanal. Ideal para sorprender en aniversarios y fechas especiales. Incluye tarjeta de dedicatoria.",
    imagenes: [imgRomantico, imgAurora],
    categoria_id: "amor-aniversario",
    parent_id: "ocasion",
    tags: ["mas_vendido"],
    activo: true,
  },
  // ── Ocasión / Cumpleaños
  {
    id: "velvet-box",
    nombre: "Velvet Box",
    precio: 220,
    descripcion:
      "Nuestro arreglo estrella en caja aterciopelada negra con rosas importadas y follaje exótico. Una pieza que impacta desde el primer vistazo.",
    imagenes: [imgVelvet, imgRomantico],
    categoria_id: "cumpleanos",
    parent_id: "ocasion",
    tags: ["edicion_limitada"],
    activo: true,
  },
  {
    id: "aurora",
    nombre: "Aurora",
    precio: 165,
    descripcion:
      "Composición en tonos pastel con flores silvestres y rosas blancas. Frescura y elegancia en cada tallo.",
    imagenes: [imgAurora, imgPampas],
    categoria_id: "cumpleanos",
    parent_id: "ocasion",
    tags: ["novedad"],
    activo: true,
  },
  // ── Ocasión / Nacimientos
  {
    id: "pampas-nacimiento",
    nombre: "Pampas & Suaves",
    precio: 130,
    descripcion:
      "Arreglo delicado con pampas, flores blancas y detalles en eucalipto. Perfecto para dar la bienvenida a la nueva vida.",
    imagenes: [imgPampas, imgAurora],
    categoria_id: "nacimientos",
    parent_id: "ocasion",
    tags: ["novedad"],
    activo: true,
  },
  // ── Arreglos Florales / Ramos
  {
    id: "ramo-primavera",
    nombre: "Ramo Primavera",
    precio: 85,
    descripcion:
      "Ramo colorido con flores de temporada: girasoles, lirios y follaje verde. Un clásico que nunca pasa de moda.",
    imagenes: [imgPrimavera, imgArreglo],
    categoria_id: "ramos",
    parent_id: "arreglos-florales",
    tags: ["mas_vendido"],
    activo: true,
  },
  {
    id: "arreglo-especial",
    nombre: "Arreglo Especial",
    precio: 120,
    descripcion:
      "Composición floral en florero de vidrio con rosas, astromelias y flores silvestres. Listo para colocar en casa u oficina.",
    imagenes: [imgArreglo, imgPrimavera],
    categoria_id: "ramos",
    parent_id: "arreglos-florales",
    tags: [],
    activo: true,
  },
  {
    id: "box-sorpresa",
    nombre: "Box Sorpresa",
    precio: 130,
    descripcion: "Combinacion sorpresa de flores frescas de temporada en caja especial.",
    imagenes: [imgSorpresa],
    categoria_id: "box-chocolates",
    parent_id: "arreglos-florales",
    tags: ["oferta"] as ProductTag[],
    activo: true,
  },
];

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categoriaId: string): Product[] {
  return products.filter((p) => p.categoria_id === categoriaId && p.activo);
}
