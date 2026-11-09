import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = parseEnv(path.resolve(".env.local"));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function measureQuery(name, queryFn) {
  const t0 = performance.now();
  const data = await queryFn();
  const ms = performance.now() - t0;
  const jsonStr = JSON.stringify(data);
  const rawBytes = Buffer.byteLength(jsonStr, "utf-8");
  const gzipBytes = zlib.gzipSync(Buffer.from(jsonStr)).length;
  const count = Array.isArray(data) ? data.length : 1;
  return {
    name,
    count,
    rawBytes,
    gzipBytes,
    rawKB: Number((rawBytes / 1024).toFixed(2)),
    gzipKB: Number((gzipBytes / 1024).toFixed(2)),
    latencyMs: Number(ms.toFixed(1)),
  };
}

console.log("=== AUDITORÍA DE EGRESS DE BASE DE DATOS (REST API) ===");

const results = [];

// 1. Productos activos completos (lo que pide /catalogo)
results.push(
  await measureQuery("getProductosActivos (974 prods con id, nombre, precio, imagenes, tags...)", async () => {
    const { data } = await supabase
      .from("productos")
      .select("id, nombre, precio, imagenes, tags, categoria_id, activo, orden, created_at")
      .eq("activo", true)
      .order("orden", { ascending: true });
    return data;
  })
);

// 2. Si solo pedimos primera imagen en listado
results.push(
  await measureQuery("getProductosActivos (optimizando campos: id, nombre, precio, primera imagen)", async () => {
    const { data } = await supabase
      .from("productos")
      .select("id, nombre, precio, imagenes, tags, categoria_id, orden")
      .eq("activo", true)
      .order("orden", { ascending: true });
    // simular quedarnos con imagenes[0]
    return (data || []).map(p => ({
      ...p,
      imagen: p.imagenes?.[0] || null,
      imagenes: undefined
    }));
  })
);

// 3. Categorias
results.push(
  await measureQuery("getCategorias (activas)", async () => {
    const { data } = await supabase.from("categorias").select("*").eq("activo", true);
    return data;
  })
);

// 4. Banners
results.push(
  await measureQuery("getBanners (activos)", async () => {
    const { data } = await supabase.from("banners").select("*").eq("activo", true);
    return data;
  })
);

// 5. Testimonios
results.push(
  await measureQuery("getTestimoniosHome", async () => {
    const { data } = await supabase.from("testimonios").select("*").eq("activo", true).limit(6);
    return data;
  })
);

// 6. Recuerdos
results.push(
  await measureQuery("getRecuerdosHome", async () => {
    const { data } = await supabase.from("recuerdos").select("*").eq("activo", true).limit(6);
    return data;
  })
);

// 7. Config
results.push(
  await measureQuery("getConfig", async () => {
    const { data } = await supabase.from("config").select("*").maybeSingle();
    return data;
  })
);

// 8. Distritos
results.push(
  await measureQuery("getDistritos", async () => {
    const { data } = await supabase.from("distritos").select("*").eq("activo", true);
    return data;
  })
);

// 9. Ficha individual de producto (1 item)
results.push(
  await measureQuery("getProductoPorId (1 producto con descripcion)", async () => {
    const { data } = await supabase.from("productos").select("*").limit(1).single();
    return data;
  })
);

console.table(results);
