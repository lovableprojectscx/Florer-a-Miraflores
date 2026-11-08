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

  it("anon NO PUEDE insertar, actualizar ni borrar en 'recuerdos', ni leer borradores", async () => {
    const { data: drafts, error: draftErr } = await anonClient
      .from("recuerdos")
      .select("id, slug, publicado")
      .eq("publicado", false)
      .limit(5);
    expect(draftErr).toBeNull();
    expect(drafts ?? []).toHaveLength(0);

    const { error: insertErr } = await anonClient.from("recuerdos").insert({
      titulo: "[RLS-TEST-NO-INSERT]",
      slug: "rls-test-no-insert-000000",
      contenido: "Intento no autorizado",
      publicado: false,
    });
    expect(isRlsError(insertErr)).toBe(true);
  });

  it("anon NO PUEDE leer correos de 'admins' ni insertar nuevos administradores", async () => {
    const { data: emailRows, error: emailErr } = await anonClient
      .from("admins")
      .select("user_id, email")
      .limit(5);
    expect(emailErr !== null || (emailRows ?? []).length === 0).toBe(true);

    const { data: idRows, error: idErr } = await anonClient
      .from("admins")
      .select("user_id")
      .limit(5);
    expect(idErr).toBeNull();
    expect(idRows ?? []).toHaveLength(0);
  });

  it("anon NO PUEDE subir ni sobrescribir archivos en Supabase Storage ('productos', 'banners', 'categorias')", async () => {
    const payload = new Blob(["rls-probe"], { type: "text/plain" });

    for (const bucket of ["productos", "banners", "categorias"] as const) {
      const { error: uploadErr } = await anonClient.storage
        .from(bucket)
        .upload("__rls_probe_unauthorized__.txt", payload, { upsert: false });
      expect(
        uploadErr !== null,
        `Bucket '${bucket}' permitió subida anónima inesperada`,
      ).toBe(true);

      const { error: updateErr } = await anonClient.storage
        .from(bucket)
        .update("__rls_probe_unauthorized__.txt", payload, { upsert: true });
      expect(
        updateErr !== null,
        `Bucket '${bucket}' permitió actualización anónima inesperada`,
      ).toBe(true);
    }
  });

  it("Trigger PostgreSQL Anti-Tampering sobreescribe precios manipulados (S/ 0.01) y fuerza estado 'pendiente' en 'pedidos'", async () => {
    const [{ data: prods, error: prodErr }, { data: dists, error: distErr }] = await Promise.all([
      anonClient.from("productos").select("id, nombre, precio").eq("activo", true).limit(1),
      anonClient.from("distritos").select("id, nombre, precio_delivery").eq("activo", true).limit(1),
    ]);
    expect(prodErr).toBeNull();
    expect(distErr).toBeNull();
    expect((prods ?? []).length).toBe(1);
    expect((dists ?? []).length).toBe(1);

    const realProd = prods![0];
    const realDist = dists![0];
    const qty = 2;
    const expectedSubtotal = (Number(realProd.precio) * qty).toFixed(2);
    const expectedDelivery = Number(realDist.precio_delivery).toFixed(2);
    const expectedTotal = (Number(realProd.precio) * qty + Number(realDist.precio_delivery)).toFixed(2);

    // Intento de ataque directo vía PostgREST / Postman enviando precio S/ 0.01, delivery S/ 0 y estado 'entregado'.
    // La marca '__RLS_TAMPER_DRY_RUN__' ejecuta todo el cálculo del trigger y aborta con código P0099 sin guardar filas.
    const { error: tamperErr } = await anonClient.from("pedidos").insert({
      numero: "FM-000000",
      nombre_cliente: "Auditoría Anti-Tampering",
      telefono: "999000111",
      email: "auditoria@floreriamiraflores.com",
      distrito_id: realDist.id,
      direccion: "Av. Larco 100",
      fecha_entrega: "2026-12-01",
      hora_entrega: "manana",
      productos: [
        {
          id: realProd.id,
          nombre: "PRECIO ADULTERADO",
          precio: 0.01,
          cantidad: qty,
          imagen: "",
        },
      ],
      subtotal: 0.02,
      delivery: 0,
      total: 0.02,
      estado: "entregado",
      izi_transaction_id: "FAKE-TXN-999",
      acepto_terminos: true,
      notas: "__RLS_TAMPER_DRY_RUN__",
    });

    expect(tamperErr).not.toBeNull();
    expect(tamperErr?.code).toBe("P0099");
    expect(tamperErr?.message).toContain(
      `ANTI_TAMPER_VERIFIED:subtotal=${expectedSubtotal}|delivery=${expectedDelivery}|total=${expectedTotal}|estado=pendiente`,
    );
  });
});
