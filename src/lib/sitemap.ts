import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import type { CategoriaRow, ProductoRow } from "@/types/database";

const BASE_URL = "https://floreriamiraflores.com";

function formatDate(dateValue: string | null | undefined, fallback: string): string {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return d.toISOString().split("T")[0];
  } catch {
    return fallback;
  }
}

/**
 * Genera dinámicamente el XML del sitemap consultando Supabase en tiempo real.
 * Cumple con Fase 1 SEO:
 * - A6: Rutas preferidas canónicas (anidadas /categoria/padre/hija), lastmod reales desde updated_at/created_at
 * - A2: Exclusión de /categoria/defuncion y categorías vacías sin productos activos
 * - Formato XML estándar limpio (sin priority ni changefreq)
 */
export async function generateSitemapXml(): Promise<string> {
  const now = new Date().toISOString().split("T")[0];

  // Páginas estáticas principales
  const urls: Array<{ loc: string; lastmod: string }> = [
    { loc: `${BASE_URL}/`, lastmod: now },
    { loc: `${BASE_URL}/catalogo`, lastmod: now },
    { loc: `${BASE_URL}/resenas`, lastmod: now },
    { loc: `${BASE_URL}/recuerdos`, lastmod: now },
    { loc: `${BASE_URL}/nosotros`, lastmod: "2026-10-15" },
    { loc: `${BASE_URL}/terminos`, lastmod: "2026-10-15" },
    { loc: `${BASE_URL}/privacidad`, lastmod: "2026-10-15" },
    { loc: `${BASE_URL}/cambios-y-devoluciones`, lastmod: "2026-10-15" },
    { loc: `${BASE_URL}/libro-de-reclamaciones`, lastmod: "2026-10-15" },
  ];

  try {
    // 1. Cargar productos activos para calcular lastmod y conteo por categoría
    const { data: productos } = await supabase.from("productos").select("*").eq("activo", true);

    const prodsPorCategoria = new Map<string, number>();
    const lastmodPorCategoria = new Map<string, string>();

    const prods = (productos || []) as (ProductoRow & { updated_at?: string })[];

    for (const prod of prods) {
      const catId = prod.categoria_id;
      const prodDate = prod.updated_at || prod.created_at;
      if (catId) {
        prodsPorCategoria.set(catId, (prodsPorCategoria.get(catId) || 0) + 1);
        const currentLatest = lastmodPorCategoria.get(catId);
        if (!currentLatest || (prodDate && prodDate > currentLatest)) {
          lastmodPorCategoria.set(catId, prodDate);
        }
      }
    }

    // 2. Cargar categorías activas
    const { data: categorias } = await supabase
      .from("categorias")
      .select("id, nombre, slug, parent_id, orden, activo")
      .eq("activo", true)
      .order("orden", { ascending: true });

    if (categorias) {
      const catList = categorias as CategoriaRow[];
      const catMap = new Map(catList.map((c) => [c.id, c]));

      for (const cat of catList) {
        const hijas = catList.filter((h) => h.parent_id === cat.id);
        const directCount = prodsPorCategoria.get(cat.id) || 0;
        const childCount = hijas.reduce((acc, h) => acc + (prodsPorCategoria.get(h.id) || 0), 0);
        const totalProds = directCount + childCount;

        const padre = cat.parent_id ? catMap.get(cat.parent_id) : null;
        const isDefuncionFamily = cat.slug === "defuncion" || padre?.slug === "defuncion";

        // A2: Excluir /categoria/defuncion y categorías vacías sin productos activos
        if ((isDefuncionFamily && totalProds === 0) || totalProds === 0) {
          continue;
        }

        // A6: Construir URL preferida canónica (anidada si tiene categoría padre)
        const categoryUrl = padre
          ? `${BASE_URL}/categoria/${padre.slug}/${cat.slug}`
          : `${BASE_URL}/categoria/${cat.slug}`;

        const catLastDate = lastmodPorCategoria.get(cat.id);
        urls.push({
          loc: categoryUrl,
          lastmod: formatDate(catLastDate, now),
        });
      }
    }

    // 3. Agregar productos activos al sitemap con lastmod real
    for (const prod of prods) {
      const slug = `${slugify(prod.nombre)}-${prod.id}`;
      const prodDate = prod.updated_at || prod.created_at;
      urls.push({
        loc: `${BASE_URL}/producto/${slug}`,
        lastmod: formatDate(prodDate, now),
      });
    }

    // 4. Recuerdos de entrega publicados
    try {
      const { data: recuerdos } = await supabase
        .from("recuerdos")
        .select("slug, updated_at, fecha_publicacion, created_at")
        .eq("publicado", true)
        .lte("fecha_publicacion", new Date().toISOString());

      if (recuerdos) {
        for (const item of recuerdos as Array<{
          slug: string;
          updated_at?: string;
          fecha_publicacion?: string;
          created_at?: string;
        }>) {
          const itemDate = item.updated_at || item.fecha_publicacion || item.created_at;
          urls.push({
            loc: `${BASE_URL}/recuerdos/${item.slug}`,
            lastmod: formatDate(itemDate, now),
          });
        }
      }
    } catch {
      // Silencioso si recuerdos no está disponible
    }
  } catch (err) {
    console.error("Error al consultar Supabase para sitemap dinámico:", err);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}
