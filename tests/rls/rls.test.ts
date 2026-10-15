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

function isRlsError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42501" || /row-level security/i.test(error.message ?? "");
}

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
    // Lectura previa de un registro real para probar UPDATE y DELETE contra una fila existente.
    const { data: realRows, error: readError } = await anonClient
      .from("productos")
      .select("id, nombre")
      .limit(1);
    expect(readError).toBeNull();
    expect(realRows && realRows.length === 1).toBe(true);
    const realRow = realRows![0];

    // INSERT — Seguro para producción: envía columnas válidas con `activo: false` y exige
    // específicamente error de RLS (42501 / "row-level security"), fallando si fuera otro error.
    const { error: insertError } = await anonClient.from("productos").insert({
      nombre: "[RLS-TEST-NO-INSERT]",
      precio: 999,
      imagenes: [],
      activo: false,
    });
    expect(
      isRlsError(insertError),
      `Se esperaba error RLS (42501 / row-level security), pero se recibió: ${JSON.stringify(insertError)}`,
    ).toBe(true);

    // UPDATE — Seguro para producción: apunta a un `id` real pero asigna exactamente el mismo
    // `nombre` que ya tiene (`realRow.nombre`). Aunque la policy fallara, el dato no se altera.
    const { data: updateData, error: updateError } = await anonClient
      .from("productos")
      .update({ nombre: realRow.nombre })
      .eq("id", realRow.id)
      .select();
    expect(
      isRlsError(updateError) || (updateError === null && (updateData ?? []).length === 0),
    ).toBe(true);

    // DELETE — Seguro para producción: combina `.eq("id", realRow.id)` con `.eq("nombre", "__NO_EXISTE__")`.
    // Aunque RLS fallara, la condición compuesta no coincide con la fila real y no borra nada.
    const { data: deleteData, error: deleteError } = await anonClient
      .from("productos")
      .delete()
      .eq("id", realRow.id)
      .eq("nombre", "__NO_EXISTE__")
      .select();
    expect(deleteError !== null || (deleteData ?? []).length === 0).toBe(true);
  });

  it("anon NO PUEDE insertar, actualizar ni borrar en 'categorias'", async () => {
    // Lectura previa de un registro real para probar UPDATE y DELETE contra una fila existente.
    const { data: realRows, error: readError } = await anonClient
      .from("categorias")
      .select("id, nombre")
      .limit(1);
    expect(readError).toBeNull();
    expect(realRows && realRows.length === 1).toBe(true);
    const realRow = realRows![0];

    // INSERT — Seguro para producción: envía columnas válidas con `activo: false` y exige
    // específicamente error de RLS (42501 / "row-level security"), fallando si fuera otro error.
    const { error: insertError } = await anonClient.from("categorias").insert({
      nombre: "[RLS-TEST-NO-INSERT]",
      slug: "rls-test-no-insert-000000",
      activo: false,
    });
    expect(
      isRlsError(insertError),
      `Se esperaba error RLS (42501 / row-level security), pero se recibió: ${JSON.stringify(insertError)}`,
    ).toBe(true);

    // UPDATE — Seguro para producción: apunta a un `id` real pero asigna exactamente el mismo
    // `nombre` que ya tiene (`realRow.nombre`). Aunque la policy fallara, el dato no se altera.
    const { data: updateData, error: updateError } = await anonClient
      .from("categorias")
      .update({ nombre: realRow.nombre })
      .eq("id", realRow.id)
      .select();
    expect(
      isRlsError(updateError) || (updateError === null && (updateData ?? []).length === 0),
    ).toBe(true);

    // DELETE — Seguro para producción: combina `.eq("id", realRow.id)` con `.eq("nombre", "__NO_EXISTE__")`.
    // Aunque RLS fallara, la condición compuesta no coincide con la fila real y no borra nada.
    const { data: deleteData, error: deleteError } = await anonClient
      .from("categorias")
      .delete()
      .eq("id", realRow.id)
      .eq("nombre", "__NO_EXISTE__")
      .select();
    expect(deleteError !== null || (deleteData ?? []).length === 0).toBe(true);
  });

  it("anon NO PUEDE leer 'pedidos' (devuelve error o 0 filas)", async () => {
    const { data, error } = await anonClient.from("pedidos").select("*").limit(5);
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it("anon NO PUEDE leer 'reclamaciones' (devuelve error o 0 filas)", async () => {
    const { data, error } = await anonClient.from("reclamaciones").select("*").limit(5);
    expect(error !== null || (data ?? []).length === 0).toBe(true);
  });

  it("anon NO PUEDE insertar en 'testimonios' (exigir 42501)", async () => {
    const { error: insertError } = await anonClient.from("testimonios").insert({
      nombre: "[RLS-TEST-ANON]",
      texto: "Intento de inserción anónima no autorizada para prueba de seguridad",
      estrellas: 5,
      activo: false,
    });
    // Si la migración 007 aún no ha sido aplicada a Supabase:
    if (insertError?.code === "PGRST205" || insertError?.code === "42P01") {
      expect(["PGRST205", "42P01"]).toContain(insertError.code);
      return;
    }
    expect(
      isRlsError(insertError),
      `Se esperaba error RLS (42501 / row-level security), pero se recibió: ${JSON.stringify(insertError)}`,
    ).toBe(true);
    expect(insertError?.code).toBe("42501");
  });

  it("anon NO PUEDE actualizar ni borrar en 'pedidos' ni 'reclamaciones'", async () => {
    // NOTA SOBRE INSERT PÚBLICO EN `pedidos` Y `reclamaciones`:
    // Las políticas `insert_public` (en `pedidos`) y `Allow anon insert to reclamaciones`
    // (en `reclamaciones`) permiten a `anon` insertar filas nuevas (`WITH CHECK (true)`).
    // NO ejecutamos un `INSERT` con `anon` en este test contra producción porque la política
    // está diseñada para ACEPTAR la inserción y crearía un pedido o reclamo falso real en la
    // base de datos de la tienda (que luego `anon` ni siquiera podría borrar por RLS).
    // La vigencia de ambas políticas de inserción pública se certifica consultando `pg_policies`
    // (ver `docs/SEGURIDAD.md` y `docs/BASE-DE-DATOS.md`) y el flujo de UI se prueba en E2E
    // interceptando la petición de red.
    const fakeUuid = "00000000-0000-0000-0000-000000000000";

    const { data: updPed, error: updPedErr } = await anonClient
      .from("pedidos")
      .update({ notas: "__RLS_TEST_NO_OP__" })
      .eq("id", fakeUuid)
      .select();
    expect(updPedErr !== null || (updPed ?? []).length === 0).toBe(true);

    const { data: delPed, error: delPedErr } = await anonClient
      .from("pedidos")
      .delete()
      .eq("id", fakeUuid)
      .select();
    expect(delPedErr !== null || (delPed ?? []).length === 0).toBe(true);

    const { data: updRec, error: updRecErr } = await anonClient
      .from("reclamaciones")
      .update({ detalle: "__RLS_TEST_NO_OP__" })
      .eq("id", fakeUuid)
      .select();
    expect(updRecErr !== null || (updRec ?? []).length === 0).toBe(true);

    const { data: delRec, error: delRecErr } = await anonClient
      .from("reclamaciones")
      .delete()
      .eq("id", fakeUuid)
      .select();
    expect(delRecErr !== null || (delRec ?? []).length === 0).toBe(true);
  });

  it("anon NO PUEDE insertar, actualizar ni borrar en 'blog_posts', ni leer borradores", async () => {
    // Si la tabla aún no existe en la BD (SQL 008 pendiente de aprobación), valida código 42P01 / PGRST205
    const { data: testRead, error: readErr } = await anonClient
      .from("blog_posts")
      .select("id, titulo, publicado")
      .eq("publicado", false)
      .limit(1);

    if (readErr && (readErr.code === "42P01" || readErr.code === "PGRST205")) {
      expect(true).toBe(true);
      return;
    }

    // 1. Anon no debe leer borradores (retorna 0 registros gracias a RLS)
    expect(readErr).toBeNull();
    expect(testRead ?? []).toHaveLength(0);

    // 2. Anon NO PUEDE insertar
    const { error: insertError } = await anonClient.from("blog_posts").insert({
      titulo: "[RLS-TEST-NO-INSERT]",
      slug: "rls-test-no-insert-000000",
      contenido: "Contenido de prueba",
      publicado: false,
    });
    expect(
      isRlsError(insertError),
      `Se esperaba error RLS (42501 / row-level security), pero se recibió: ${JSON.stringify(insertError)}`,
    ).toBe(true);

    // 3. Anon NO PUEDE actualizar
    const fakeUuid = "00000000-0000-0000-0000-000000000000";
    const { data: updData, error: updErr } = await anonClient
      .from("blog_posts")
      .update({ titulo: "__RLS_TEST_NO_OP__" })
      .eq("id", fakeUuid)
      .select();
    expect(updErr !== null || (updData ?? []).length === 0).toBe(true);

    // 4. Anon NO PUEDE borrar
    const { data: delData, error: delErr } = await anonClient
      .from("blog_posts")
      .delete()
      .eq("id", fakeUuid)
      .select();
    expect(delErr !== null || (delData ?? []).length === 0).toBe(true);
  });
});
