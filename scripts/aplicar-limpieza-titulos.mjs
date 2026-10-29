import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

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
  console.log("  LIMPIEZA Y NORMALIZACIÓN DE TÍTULOS DE PRODUCTOS EN SUPABASE");
  console.log("==================================================================");

  // 1. Autenticar Admin
  console.log("\n1. Autenticando admin en Supabase...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;
  console.log("✓ Admin autenticado:", auth.user.email);

  // 2. Cargar auditoría de cambios
  const audit = JSON.parse(readFileSync("scripts/data/auditoria_cambios_titulos.json", "utf-8"));
  console.log(`✓ Total productos a actualizar según auditoría: ${audit.length}`);

  // 3. Crear backup previo completo de seguridad
  console.log("\n2. Creando backup completo de la tabla productos...");
  let allProds = [];
  let from = 0;
  const step = 500;
  while (true) {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .range(from, from + step - 1);
    if (error) throw error;
    allProds.push(...data);
    if (data.length < step) break;
    from += step;
  }
  const backupFile = `scripts/data/backup_productos_pre_limpieza_titulos_${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(backupFile, JSON.stringify(allProds, null, 2), "utf-8");
  console.log(`✓ Backup guardado exitosamente (${allProds.length} productos) en ${backupFile}`);

  // 4. Aplicar actualizaciones en lotes con concurrencia controlada
  console.log("\n3. Aplicando cambios de nombres a Supabase...");
  let successCount = 0;
  let errorCount = 0;
  const concurrency = 10;

  for (let i = 0; i < audit.length; i += concurrency) {
    const batch = audit.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (item) => {
        const { error } = await supabase
          .from("productos")
          .update({ nombre: item.limpio })
          .eq("id", item.id);

        if (error) {
          console.error(`❌ Error actualizando [${item.id}] ${item.original}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      }),
    );

    if ((i + concurrency) % 50 === 0 || i + concurrency >= audit.length) {
      console.log(
        `   Progreso: ${Math.min(i + concurrency, audit.length)} / ${audit.length} productos procesados...`,
      );
    }
  }

  console.log(`\n✓ Proceso de actualización finalizado.`);
  console.log(`  Exitosos: ${successCount}`);
  console.log(`  Errores:   ${errorCount}`);

  // 5. Verificación post-actualización
  console.log("\n4. Verificando estado final en base de datos...");
  let postProds = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("productos")
      .select("id, nombre")
      .range(from, from + step - 1);
    if (error) throw error;
    postProds.push(...data);
    if (data.length < step) break;
    from += step;
  }

  const residualLote = postProds.filter((p) => /^Lote/i.test(p.nombre));
  const residualPack = postProds.filter((p) => /Pack\s*\d+/i.test(p.nombre));
  const residualHash = postProds.filter((p) => /#\d+/.test(p.nombre));
  const residualTrunc = postProds.filter((p) =>
    /^(Bouq|Centro F|Box Dorad|Arregl|Arreglo S)$/i.test(p.nombre),
  );

  console.log("==================================================================");
  console.log("  RESULTADOS DE VERIFICACIÓN POST-LIMPIEZA:");
  console.log(`  - Total productos en DB: ${postProds.length}`);
  console.log(`  - Productos con prefijo 'Lote': ${residualLote.length}`);
  console.log(`  - Productos con sufijo 'Pack':   ${residualPack.length}`);
  console.log(`  - Productos con sufijo '#...':   ${residualHash.length}`);
  console.log(`  - Productos truncados:           ${residualTrunc.length}`);
  console.log("==================================================================");
}

main().catch(console.error);
