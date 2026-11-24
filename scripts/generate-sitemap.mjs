/**
 * Script de generación de sitemap.xml para producción (SEO).
 * Consulta rutas públicas, categorías activas y productos activos vía Supabase (solo lectura).
 *
 * Cumple con Fase 1 SEO:
 * - A6: Rutas preferidas canónicas (anidadas /categoria/padre/hija), lastmod reales y formato limpio sin priority/changefreq.
 * - A2: Exclusión de /categoria/defuncion mientras no tenga productos activos.
 *
 * Ejecución: node scripts/generate-sitemap.mjs
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";

const BASE_URL = "https://floreriamiraflores.com";

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function formatDate(dateValue, fallback) {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return fallback;
    return d.toISOString().split("T")[0];
  } catch {
    return fallback;
  }
}

async function main() {
  const env = loadEnv("production", process.cwd(), "");
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  const now = new Date().toISOString().split("T")[0];

  // Páginas estáticas principales
  const urls = [
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

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      // 1. Cargar productos activos primero para calcular lastmod y conteo por categoría
      const { data: productos, error: prodErr } = await supabase
        .from("productos")
        .select("*")
        .eq("activo", true);

      if (prodErr) {
        console.warn("Error cargando productos para sitemap:", prodErr.message);
      }

      const prodsPorCategoria = new Map();
      const lastmodPorCategoria = new Map();

      if (productos) {
        for (const prod of productos) {
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
      }

      // 2. Cargar categorías activas
      const { data: categorias, error: catErr } = await supabase
        .from("categorias")
        .select("id, nombre, slug, parent_id, orden, activo")
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (catErr) {
        console.warn("Error cargando categorías para sitemap:", catErr.message);
      }

      if (categorias) {
        const catMap = new Map(categorias.map((c) => [c.id, c]));

        for (const cat of categorias) {
          // Conteo total incluyendo subcategorías
          const hijas = categorias.filter((h) => h.parent_id === cat.id);
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
          let categoryUrl;
          if (padre) {
            categoryUrl = `${BASE_URL}/categoria/${padre.slug}/${cat.slug}`;
          } else {
            categoryUrl = `${BASE_URL}/categoria/${cat.slug}`;
          }

          // Calcular lastmod real de la categoría a partir de sus productos o now
          const catLastDate = lastmodPorCategoria.get(cat.id);
          urls.push({
            loc: categoryUrl,
            lastmod: formatDate(catLastDate, now),
          });
        }
      }

      // 3. Agregar productos activos al sitemap con lastmod real
      if (productos) {
        for (const prod of productos) {
          const slug = `${slugify(prod.nombre)}-${prod.id}`;
          const prodDate = prod.updated_at || prod.created_at;
          urls.push({
            loc: `${BASE_URL}/producto/${slug}`,
            lastmod: formatDate(prodDate, now),
          });
        }
      }

      // 4. Recuerdos de entrega publicados
      try {
        const { data: recuerdos } = await supabase
          .from("recuerdos")
          .select("slug, updated_at, fecha_publicacion, created_at")
          .eq("publicado", true)
          .lte("fecha_publicacion", new Date().toISOString());

        if (recuerdos) {
          for (const item of recuerdos) {
            const itemDate = item.updated_at || item.fecha_publicacion || item.created_at;
            urls.push({
              loc: `${BASE_URL}/recuerdos/${item.slug}`,
              lastmod: formatDate(itemDate, now),
            });
          }
        }
      } catch {
        // Fallback silencioso si recuerdos aún no existe
      }
    } catch (err) {
      console.warn("No se pudieron cargar datos dinámicos de Supabase para sitemap:", err);
    }
  }

  // Generar XML con formato estándar limpio (loc y lastmod, sin priority ni changefreq según A6)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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

  const targetPath = resolve(process.cwd(), "public", "sitemap.xml");
  writeFileSync(targetPath, xml, "utf-8");
  console.log(`sitemap.xml generado exitosamente con ${urls.length} URLs en ${targetPath}`);
}

main().catch((err) => {
  console.error("Error al generar sitemap:", err);
  process.exit(1);
});
