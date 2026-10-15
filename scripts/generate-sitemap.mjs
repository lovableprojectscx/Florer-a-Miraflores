/**
 * Script de generación de sitemap.xml para producción (SEO).
 * Consulta rutas públicas, categorías activas y productos activos vía Supabase (solo lectura).
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

async function main() {
  const env = loadEnv("production", process.cwd(), "");
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  const now = new Date().toISOString().split("T")[0];

  const urls = [
    { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${BASE_URL}/catalogo`, priority: "0.9", changefreq: "daily" },
    { loc: `${BASE_URL}/resenas`, priority: "0.8", changefreq: "weekly" },
    { loc: `${BASE_URL}/blog`, priority: "0.8", changefreq: "weekly" },
    { loc: `${BASE_URL}/nosotros`, priority: "0.7", changefreq: "monthly" },
    { loc: `${BASE_URL}/libro-de-reclamaciones`, priority: "0.3", changefreq: "yearly" },
  ];

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      // 1. Categorías activas
      const { data: categorias } = await supabase
        .from("categorias")
        .select("slug")
        .eq("activo", true);

      if (categorias) {
        for (const cat of categorias) {
          urls.push({
            loc: `${BASE_URL}/categoria/${cat.slug}`,
            priority: "0.8",
            changefreq: "weekly",
          });
        }
      }

      // 2. Productos activos
      const { data: productos } = await supabase
        .from("productos")
        .select("id, nombre")
        .eq("activo", true);

      if (productos) {
        for (const prod of productos) {
          const slug = `${slugify(prod.nombre)}-${prod.id}`;
          urls.push({
            loc: `${BASE_URL}/producto/${slug}`,
            priority: "0.8",
            changefreq: "weekly",
          });
        }
      }

      // 3. Artículos de blog publicados
      try {
        const { data: posts } = await supabase
          .from("blog_posts")
          .select("slug, updated_at, fecha_publicacion")
          .eq("publicado", true)
          .lte("fecha_publicacion", new Date().toISOString());

        if (posts) {
          for (const post of posts) {
            const postLastMod = post.updated_at
              ? new Date(post.updated_at).toISOString().split("T")[0]
              : now;
            urls.push({
              loc: `${BASE_URL}/blog/${post.slug}`,
              lastmod: postLastMod,
              priority: "0.7",
              changefreq: "monthly",
            });
          }
        }
      } catch {
        // Fallback silencioso si blog_posts aún no existe
      }
    } catch (err) {
      console.warn("No se pudieron cargar datos dinámicos de Supabase para sitemap:", err);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
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
