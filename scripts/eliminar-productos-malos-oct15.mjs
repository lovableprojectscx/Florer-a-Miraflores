import { createClient } from "@supabase/supabase-js";
import { writeFileSync, existsSync } from "node:fs";

const supabaseUrl = "https://sdrkiomeesoctsxeidmu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcmtpb21lZXNvY3RzeGVpZG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjE3MzAsImV4cCI6MjA5NDczNzczMH0.PSWFG95ZjsabOTNnOLf1CkA035H7tU3EwSNnEAYy0u8";

const adminEmail = "pedidos@floreriamiraflores.com";
const adminPassword = "idenza.site";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("==================================================================");
  console.log("  PURGA DE PRODUCTOS Y FOTOS MAL CARGADAS (LOTE 15-OCT)");
  console.log("==================================================================");

  // 1. Autenticar Admin
  console.log("\n1. Autenticando admin...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;
  console.log("✓ Admin autenticado exitosamente:", auth.user.email);

  // 2. Consultar productos del 15 de octubre
  console.log("\n2. Consultando productos a eliminar (created_at >= 2026-10-15)...");
  const { data: prodsParaBorrar, error: pErr } = await supabase
    .from("productos")
    .select("id, nombre, imagenes, created_at")
    .gte("created_at", "2026-10-15T00:00:00Z");
  if (pErr) throw pErr;

  console.log(`✓ Encontrados ${prodsParaBorrar.length} productos del lote de 15-Oct.`);

  // 3. Eliminar productos de la base de datos
  console.log("\n3. Eliminando productos de la tabla 'productos'...");
  const ids = prodsParaBorrar.map((p) => p.id);
  const { error: delErr } = await supabase
    .from("productos")
    .delete()
    .in("id", ids);
  if (delErr) throw delErr;
  console.log(`✓ Eliminados con éxito ${ids.length} productos de la base de datos.`);

  // 4. Limpiar fotos y miniaturas de Storage
  console.log("\n4. Limpiando archivos de Supabase Storage (bucket: productos)...");
  
  // Archivos originales prod_4k_ y test_
  const storageFilesToDelete = [];
  for (const p of prodsParaBorrar) {
    if (p.imagenes && p.imagenes[0]) {
      const parts = p.imagenes[0].split("/productos/");
      if (parts[1]) {
        const origName = parts[1];
        storageFilesToDelete.push(origName);
        storageFilesToDelete.push(`thumbs/480/${origName}`);
        storageFilesToDelete.push(`thumbs/960/${origName}`);
      }
    }
  }

  // Eliminar en lotes de 50
  const BATCH_SIZE = 50;
  let filesRemoved = 0;
  for (let i = 0; i < storageFilesToDelete.length; i += BATCH_SIZE) {
    const batch = storageFilesToDelete.slice(i, i + BATCH_SIZE);
    const { error: sErr } = await supabase.storage
      .from("productos")
      .remove(batch);
    if (!sErr) filesRemoved += batch.length;
  }
  console.log(`✓ Eliminados ${filesRemoved} archivos y miniaturas de Supabase Storage.`);

  // 5. Verificación final de la base de datos
  console.log("\n5. Verificando estado final de la base de datos...");
  const { count, error: countErr } = await supabase
    .from("productos")
    .select("*", { count: "exact", head: true });
  if (countErr) throw countErr;

  console.log(`==================================================================`);
  console.log(`  ¡LIMPIEZA COMPLETADA!`);
  console.log(`  Productos activos restantes en BD: ${count} (Catálogo oficial limpio)`);
  console.log(`==================================================================`);
}

main().catch(console.error);
