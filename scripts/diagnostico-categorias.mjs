/**
 * Script de diagnóstico de categorías y productos (SOLO LECTURA / SELECT).
 * Usa @supabase/supabase-js con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY de .env.local.
 *
 * Ejecución: node scripts/diagnostico-categorias.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";

const env = loadEnv("development", process.cwd(), "");
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("=== DIAGNÓSTICO DE CATEGORÍAS (VISTA ANON KEY — SOLO SELECT) ===\n");

  const { data: categorias, error: catErr } = await supabase
    .from("categorias")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  if (catErr) {
    console.error("Error al consultar categorias:", catErr);
    process.exit(1);
  }

  const { data: productos, error: prodErr } = await supabase
    .from("productos")
    .select("id, nombre, precio, categoria_id, activo, tags, orden")
    .order("orden", { ascending: true });

  if (prodErr) {
    console.error("Error al consultar productos:", prodErr);
    process.exit(1);
  }

  const cats = categorias ?? [];
  const prods = productos ?? [];
  const prodsActivos = prods.filter((p) => p.activo);

  console.log(
    `Total categorías visibles para anon: ${cats.length} (activas: ${cats.filter((c) => c.activo).length}, inactivas visibles: ${cats.filter((c) => !c.activo).length})`,
  );
  console.log(
    `Total productos visibles para anon: ${prods.length} (activos: ${prodsActivos.length}, inactivos visibles: ${prods.filter((p) => !p.activo).length})\n`,
  );

  const catById = new Map(cats.map((c) => [c.id, c]));
  const activeCountByCat = new Map();
  for (const c of cats) activeCountByCat.set(c.id, 0);
  for (const p of prodsActivos) {
    if (p.categoria_id) {
      activeCountByCat.set(p.categoria_id, (activeCountByCat.get(p.categoria_id) ?? 0) + 1);
    }
  }

  // 1. Árbol completo de categorías visibles para anon
  console.log("1. ÁRBOL DE CATEGORÍAS VISIBLES PARA ANON:");
  const padres = cats.filter((c) => !c.parent_id);
  const hijas = cats.filter((c) => c.parent_id);

  for (const p of padres) {
    const directCount = activeCountByCat.get(p.id) ?? 0;
    const subcats = hijas.filter((h) => h.parent_id === p.id);
    const childrenSum = subcats.reduce((acc, s) => acc + (activeCountByCat.get(s.id) ?? 0), 0);
    console.log(
      `  [PADRE] ${p.nombre} | slug="${p.slug}" | id=${p.id} | activo=${p.activo} | orden=${p.orden} | parent_id=${p.parent_id} | prods_directos=${directCount} | prods_en_hijas=${childrenSum}`,
    );
    for (const s of subcats) {
      const sCount = activeCountByCat.get(s.id) ?? 0;
      console.log(
        `    ↳ [SUB] ${s.nombre} | slug="${s.slug}" | id=${s.id} | activo=${s.activo} | orden=${s.orden} | parent_id=${s.parent_id} | prods_directos=${sCount}`,
      );
    }
  }

  // 2. Categorías huérfanas y subcategorías con 0 productos
  console.log("\n2. CATEGORÍAS HUÉRFANAS Y SUBCATEGORÍAS CON 0 PRODUCTOS:");
  const huerfanas = hijas.filter((h) => !catById.has(h.parent_id));
  if (huerfanas.length === 0) {
    console.log("  - Categorías huérfanas (parent_id inexistente en vista anon): Ninguna (0)");
  } else {
    for (const h of huerfanas) {
      console.log(
        `  - [HUÉRFANA] ${h.nombre} (slug="${h.slug}", id=${h.id}, parent_id=${h.parent_id})`,
      );
    }
  }

  const subcatsSinProductos = hijas.filter((h) => (activeCountByCat.get(h.id) ?? 0) === 0);
  if (subcatsSinProductos.length === 0) {
    console.log("  - Subcategorías con 0 productos activos: Ninguna (0)");
  } else {
    console.log(`  - Subcategorías con 0 productos activos (${subcatsSinProductos.length}):`);
    for (const s of subcatsSinProductos) {
      const parent = catById.get(s.parent_id);
      console.log(
        `    * ${parent ? parent.nombre : "?"} › ${s.nombre} (slug="${s.slug}", id=${s.id}, activo=${s.activo})`,
      );
    }
  }

  // Padres con 0 productos directos y 0 en hijas
  const padresVacios = padres.filter((p) => {
    const direct = activeCountByCat.get(p.id) ?? 0;
    const subcats = hijas.filter((h) => h.parent_id === p.id);
    const subSum = subcats.reduce((acc, s) => acc + (activeCountByCat.get(s.id) ?? 0), 0);
    return direct + subSum === 0;
  });
  if (padresVacios.length > 0) {
    console.log(`  - Categorías padre con 0 productos totales (${padresVacios.length}):`);
    for (const pv of padresVacios) {
      console.log(`    * ${pv.nombre} (slug="${pv.slug}", id=${pv.id}, activo=${pv.activo})`);
    }
  }

  function formatCatLabel(catId) {
    if (!catId) return "SIN CATEGORÍA (null)";
    const c = catById.get(catId);
    if (!c) return `CATEGORÍA NO VISIBLE/INEXISTENTE (${catId})`;
    if (!c.parent_id) return `${c.nombre} [PADRE, slug="${c.slug}"]`;
    const parent = catById.get(c.parent_id);
    return `${parent ? parent.nombre : "?"} › ${c.nombre} [SUB, slug="${c.slug}"]`;
  }

  // 3. Productos activos cuyo nombre contenga "tulip" + productos en jerarquía Tulipanes
  console.log('\n3. PRODUCTOS ACTIVOS CUYO NOMBRE CONTIENE "tulip" Y JERARQUÍA TULIPANES:');
  const tulipProds = prodsActivos.filter((p) => /tulip/i.test(p.nombre));
  console.log(`  3a) Por nombre con "tulip" (${tulipProds.length}):`);
  for (const p of tulipProds) {
    console.log(`    - "${p.nombre}" (S/ ${p.precio}) -> ${formatCatLabel(p.categoria_id)}`);
  }

  const tulipPadre = cats.find((c) => c.slug === "tulipanes");
  if (tulipPadre) {
    const enTulipPadre = prodsActivos.filter((p) => p.categoria_id === tulipPadre.id);
    console.log(
      `  3b) Asignados directamente a [PADRE] Tulipanes (${enTulipPadre.length} productos que NO salen en /categoria/tulipanes/tulipanes-arreglos ni en /categoria/tulipanes/tulipanes-ramos):`,
    );
    for (const p of enTulipPadre) {
      console.log(`    - "${p.nombre}" (id=${p.id}, S/ ${p.precio})`);
    }

    const subTulip = cats.filter((c) => c.parent_id === tulipPadre.id);
    for (const st of subTulip) {
      const prodsSub = prodsActivos.filter((p) => p.categoria_id === st.id);
      console.log(
        `  3b-sub) Productos en Tulipanes › ${st.nombre} [slug="${st.slug}"] (${prodsSub.length}):`,
      );
      for (const p of prodsSub) {
        console.log(`    - "${p.nombre}" (S/ ${p.precio})`);
      }
    }
  }

  // Categorías con nombres duplicados o ambiguos en el select plano de /admin/productos
  const byName = new Map();
  for (const c of cats) {
    byName.set(c.nombre, [...(byName.get(c.nombre) ?? []), c]);
  }
  console.log("  3c) Nombres de categoría duplicados en el <select> plano de /admin/productos:");
  for (const [nombre, list] of byName.entries()) {
    if (list.length > 1) {
      console.log(
        `    - "${nombre}" aparece ${list.length} veces: ${list.map((x) => `${formatCatLabel(x.id)} (id=${x.id})`).join(" | ")}`,
      );
    }
  }

  // 4. Productos activos cuyo nombre contenga "nacimiento", "bebé", "bebe", "baby", "niño", "niña"
  console.log(
    '\n4. PRODUCTOS ACTIVOS CUYO NOMBRE CONTIENE "nacimiento", "bebé", "bebe", "baby", "niño", "niña":',
  );
  const nacRegex = /nacimiento|beb[eé]|baby|niñ[oa]/i;
  const nacProds = prodsActivos.filter((p) => nacRegex.test(p.nombre));
  console.log(`  Total encontrados por nombre: ${nacProds.length}`);
  for (const p of nacProds) {
    console.log(`  - "${p.nombre}" (S/ ${p.precio}) -> ${formatCatLabel(p.categoria_id)}`);
  }

  // 5. ¿Se encuentra "nacimientos" o no? + estado en colecciones_home y ocasiones_home
  console.log('\n5. BÚSQUEDA DE CATEGORÍA "nacimientos" (por slug o nombre) Y PRESENCIA EN HOME:');
  const nacCats = cats.filter(
    (c) => /nacimiento/i.test(c.nombre) || /nacimiento/i.test(c.slug ?? ""),
  );
  if (nacCats.length === 0) {
    console.log(
      '  - RESULTADO: NO se encontró ninguna categoría con "nacimiento" / "nacimientos" visible para anon.',
    );
  } else {
    for (const nc of nacCats) {
      const parent = nc.parent_id ? catById.get(nc.parent_id) : null;
      console.log(
        `  - ENCONTRADA: nombre="${nc.nombre}" | slug="${nc.slug}" | id=${nc.id} | activo=${nc.activo} | imagen_url=${nc.imagen_url ?? "null"} | parent=${parent ? `${parent.nombre} (${parent.slug})` : "NULL (Padre)"} | prods_directos=${activeCountByCat.get(nc.id) ?? 0}`,
      );
      const prodsEnNac = prodsActivos.filter((p) => p.categoria_id === nc.id);
      console.log(`    Primeros 10 productos en "${nc.nombre}" (de ${prodsEnNac.length}):`);
      for (const p of prodsEnNac.slice(0, 10)) {
        console.log(`      * "${p.nombre}" (S/ ${p.precio})`);
      }
    }
  }

  const { data: coleccionesHome } = await supabase
    .from("colecciones_home")
    .select("id, categoria_id, orden, activo")
    .order("orden", { ascending: true });
  console.log(`\n  5b) Filas visibles en colecciones_home (${(coleccionesHome ?? []).length}):`);
  for (const col of coleccionesHome ?? []) {
    console.log(
      `    - orden=${col.orden} | activo=${col.activo} | categoria=${formatCatLabel(col.categoria_id)}`,
    );
  }

  const { data: ocasionesHome } = await supabase
    .from("ocasiones_home")
    .select("id, nombre, icono, categoria_id, orden, activo")
    .order("orden", { ascending: true });
  console.log(`\n  5c) Filas visibles en ocasiones_home (${(ocasionesHome ?? []).length}):`);
  for (const oc of ocasionesHome ?? []) {
    console.log(
      `    - orden=${oc.orden} | activo=${oc.activo} | nombre="${oc.nombre}" | categoria_id=${oc.categoria_id}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
