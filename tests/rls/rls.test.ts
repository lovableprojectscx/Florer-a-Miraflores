import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { describe, expect, it } from "vitest";

const env = loadEnv("development", process.cwd(), "");
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local o variables de entorno para correr tests RLS.",
  );
}

const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const NON_EXISTENT_ID = "00000000-0000-0000-0000-000000000000";

describe("RLS — Políticas de seguridad con anon key", () => {
  it.each(["productos", "categorias", "banners", "distritos", "config"] as const)(
    "anon PUEDE leer la tabla pública '%s'",
    async (table) => {
      const { data, error } = await anonClient.from(table).select("*").limit(5);
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    },
  );

  it("anon NO PUEDE insertar, actualizar ni borrar en 'productos'", async () => {
    const { error: insertError } = await anonClient.from("productos").insert({
      id: NON_EXISTENT_ID,
      nombre: "[RLS-TEST-NO-INSERT]",
      precio: 999,
      imagenes: [],
      activo: false,
    });
    expect(insertError).not.toBeNull();

    const { data: updateData, error: updateError } = await anonClient
      .from("productos")
      .update({ nombre: "[RLS-TEST-NO-UPDATE]" })
      .eq("id", NON_EXISTENT_ID)
      .select();
    expect(updateError !== null || (updateData ?? []).length === 0).toBe(true);

    const { data: deleteData, error: deleteError } = await anonClient
      .from("productos")
      .delete()
      .eq("id", NON_EXISTENT_ID)
      .select();
    expect(deleteError !== null || (deleteData ?? []).length === 0).toBe(true);
  });

  it("anon NO PUEDE insertar, actualizar ni borrar en 'categorias'", async () => {
    const { error: insertError } = await anonClient.from("categorias").insert({
      id: NON_EXISTENT_ID,
      nombre: "[RLS-TEST-NO-INSERT]",
      slug: "rls-test-no-insert-000000",
      activo: false,
    });
    expect(insertError).not.toBeNull();

    const { data: updateData, error: updateError } = await anonClient
      .from("categorias")
      .update({ nombre: "[RLS-TEST-NO-UPDATE]" })
      .eq("id", NON_EXISTENT_ID)
      .select();
    expect(updateError !== null || (updateData ?? []).length === 0).toBe(true);

    const { data: deleteData, error: deleteError } = await anonClient
      .from("categorias")
      .delete()
      .eq("id", NON_EXISTENT_ID)
      .select();
    expect(deleteError !== null || (deleteData ?? []).length === 0).toBe(true);
  });

  it("anon NO PUEDE leer 'pedidos' (devuelve error o 0 filas)", async () => {
    const { data, error } = await anonClient.from("pedidos").select("*").limit(5);
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });
});
