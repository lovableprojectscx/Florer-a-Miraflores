/**
 * Script de verificación de imágenes públicas (Fase 06 - Certificación).
 * Inspecciona URLs de imágenes en productos activos, banners y colecciones.
 * Realiza peticiones HEAD/GET con concurrencia máxima 5.
 * Salida: docs/evidencias/fase-06/imagenes.md
 *
 * Ejecución: node scripts/verificar-imagenes.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";

const env = loadEnv("production", process.cwd(), "");
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function checkUrl(url) {
  if (!url || typeof url !== "string") {
    return { ok: false, status: 0, error: "URL vacía o no válida" };
  }

  // Si es data URL o ruta relativa local
  if (url.startsWith("data:") || url.startsWith("/")) {
    return { ok: true, status: 200, isLocal: true };
  }

  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      return { ok: true, status: res.status };
    }
    // Si el servidor rechaza HEAD con 405 Method Not Allowed, probar GET ligero
    if (res.status === 405) {
      const getRes = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-10" },
        signal: AbortSignal.timeout(8000),
      });
      return { ok: getRes.ok, status: getRes.status };
    }
    return { ok: false, status: res.status, error: `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function runPool(items, concurrency, fn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

async function main() {
  console.log("Iniciando verificación de imágenes...");

  // 1. Productos activos
  const { data: productos, error: prodErr } = await supabase
    .from("productos")
    .select("id, nombre, imagenes")
    .eq("activo", true);

  if (prodErr) throw prodErr;

  // 2. Banners activos
  const { data: banners, error: banErr } = await supabase
    .from("banners")
    .select("id, titulo, imagen_url")
    .eq("activo", true);

  if (banErr) throw banErr;

  // 3. Popup activo
  const { data: popups, error: popErr } = await supabase
    .from("popup")
    .select("id, imagen_url")
    .eq("activo", true);

  if (popErr) throw popErr;

  // 4. Colecciones activas
  const { data: colecciones, error: colErr } = await supabase
    .from("colecciones_home")
    .select("id, imagen_custom_url, categoria:categorias(nombre, imagen_url)")
    .eq("activo", true);

  if (colErr) throw colErr;

  const urlMap = new Map(); // url -> Array<{ origen, label }>

  function addUrl(url, origen, label) {
    if (!url) return;
    if (!urlMap.has(url)) {
      urlMap.set(url, []);
    }
    urlMap.get(url).push({ origen, label });
  }

  (productos || []).forEach((p) => {
    (p.imagenes || []).forEach((img, idx) => {
      addUrl(img, "productos", `${p.nombre} (img ${idx + 1})`);
    });
  });

  (banners || []).forEach((b) => {
    if (b.imagen_url) addUrl(b.imagen_url, "banners", `${b.titulo || b.id}`);
  });

  (popups || []).forEach((pop) => {
    if (pop.imagen_url) addUrl(pop.imagen_url, "popup", `Popup ${pop.id}`);
  });

  (colecciones || []).forEach((c) => {
    const cat = c.categoria;
    const img = c.imagen_custom_url || (cat && cat.imagen_url);
    if (img) addUrl(img, "colecciones", cat ? cat.nombre : c.id);
  });

  const uniqueUrls = Array.from(urlMap.keys());
  console.log(`Total URLs únicas encontradas: ${uniqueUrls.length}`);

  const checkResults = await runPool(uniqueUrls, 5, async (url) => {
    const res = await checkUrl(url);
    return { url, ...res, references: urlMap.get(url) };
  });

  const valid = checkResults.filter((r) => r.ok);
  const broken = checkResults.filter((r) => !r.ok);

  const report = `# Reporte de Verificación de Imágenes Públicas

**Fecha:** ${new Date().toISOString()}  
**Ambiente:** Supabase Producción (lectura con Anon Key)  
**Total URLs verificadas:** ${uniqueUrls.length}  
**Válidas:** ${valid.length}  
**Fallidas (404/Error):** ${broken.length}  
**Concurrencia:** 5  

---

## Resumen por Tipo de Contenido

- **Productos activos verificados:** ${(productos || []).length}
- **Banners activos verificados:** ${(banners || []).length}
- **Colecciones activas verificadas:** ${(colecciones || []).length}

---

## Imágenes Fallidas (${broken.length})

${
  broken.length === 0
    ? "✅ **Ninguna imagen rota encontrada. Todas las URLs respondieron exitosamente.**"
    : broken
        .map(
          (b) =>
            `- **URL:** \`${b.url}\`\n  - **Estado:** ${b.status} (${b.error})\n  - **Referencias:** ${b.references.map((r) => `${r.origen}: ${r.label}`).join(", ")}`,
        )
        .join("\n\n")
}

---

## Muestra de URLs Validadas (Primeras 20)

${valid
  .slice(0, 20)
  .map(
    (v) =>
      `- [HTTP ${v.status}] \`${v.url.slice(0, 90)}${v.url.length > 90 ? "..." : ""}\` (${v.references[0]?.origen})`,
  )
  .join("\n")}
`;

  const outputPath = resolve(process.cwd(), "docs/evidencias/fase-06/imagenes.md");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, report, "utf-8");

  console.log(`Reporte guardado en: ${outputPath}`);
  console.log(`Resultado: ${valid.length} válidas, ${broken.length} rotas`);
}

main().catch((err) => {
  console.error("Error en verificar-imagenes:", err);
  process.exit(1);
});
