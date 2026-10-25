import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hdudifvzlblmqgiepjgd.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkdWRpZnZ6bGJsbXFnaWVwamdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjUzMjEsImV4cCI6MjEwODEwMTMyMX0.03TibywqXFk9oAdakeGy-p23D8crYmpy1S1WgRF3bRs";
const adminEmail = "pedidos@floreriamiraflores.com";
const adminPassword = "idenza.site";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("Autenticando admin...");
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });
  if (authErr) throw authErr;

  const fakeNames = [
    "Velvet Box Deluxe",
    "Box Romántico de Rosas",
    "Aurora Silvestre",
    "Pampas & Bienvenida",
    "Ramo Primavera Vibrante",
  ];

  console.log("Eliminando productos sintéticos...");
  const { data: deleted, error: delErr } = await supabase
    .from("productos")
    .delete()
    .in("nombre", fakeNames)
    .select();

  if (delErr) throw delErr;
  console.log(`✓ Eliminados ${deleted?.length || 0} productos falsos:`);
  for (const d of deleted || []) {
    console.log(`  - ${d.nombre} (ID: ${d.id})`);
  }
}

main().catch(console.error);
