import amor from "@/assets/product-box-romantico.webp";
import cumple from "@/assets/product-arreglo-especial.webp";
import nacimiento from "@/assets/product-novedad-aurora.webp";
import tulipanes from "@/assets/product-tulipanes.webp";
import rosas from "@/assets/product-novedad-velvet.webp";

export const categories = [
  {
    slug: "amor",
    name: "Arreglos de Amor",
    tagline: "Para decir te amo sin decirlo.",
    count: "12 piezas",
    img: amor,
  },
  {
    slug: "cumpleanos",
    name: "Arreglos de Cumpleaños",
    tagline: "Sorpresas que se vuelven recuerdo.",
    count: "18 piezas",
    img: cumple,
  },
  {
    slug: "nacimientos",
    name: "Arreglos de Nacimientos",
    tagline: "La bienvenida más dulce.",
    count: "9 piezas",
    img: nacimiento,
  },
  {
    slug: "tulipanes",
    name: "Colección Tulipanes",
    tagline: "Importados, frescos cada semana.",
    count: "7 piezas",
    img: tulipanes,
  },
  {
    slug: "rosas",
    name: "Arreglo con Rosas",
    tagline: "El clásico que nunca falla.",
    count: "14 piezas",
    img: rosas,
  },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];
