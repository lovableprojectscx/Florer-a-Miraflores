import { beforeEach, describe, expect, it, vi } from "vitest";

let queryResult: { data: unknown; error: unknown } = { data: [], error: null };
let tableResults: Record<string, { data: unknown; error: unknown }> = {};

const insertMock = vi.fn();
const chainMock: Record<string, ReturnType<typeof vi.fn>> = {};
const methods = ["select", "eq", "in", "or", "overlaps", "order", "limit", "maybeSingle"];
methods.forEach((m) => {
  chainMock[m] = vi.fn(() => chainMock);
});
chainMock.insert = insertMock;
(chainMock as unknown as { then: unknown }).then = (
  resolve: (val: unknown) => void,
  reject?: (err: unknown) => void,
) => Promise.resolve(queryResult).then(resolve, reject);
chainMock.maybeSingle = vi.fn(() => Promise.resolve(queryResult));

function createTableChain(table: string) {
  const chain: Record<string, unknown> = {};
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  chain.insert = insertMock;
  chain.maybeSingle = vi.fn(() => {
    const res = tableResults[table] ?? queryResult;
    return Promise.resolve(res);
  });
  chain.then = (resolve: (val: unknown) => void, reject?: (err: unknown) => void) => {
    const res = tableResults[table] ?? queryResult;
    return Promise.resolve(res).then(resolve, reject);
  };
  return chain;
}

const fromMock = vi.fn((table?: string) => {
  if (table && tableResults[table]) {
    return createTableChain(table);
  }
  return chainMock;
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...(args as [string?])),
  },
}));

import {
  crearPedido,
  getTodasCategoriasActivas,
  getCategoriaIdsConProductosActivos,
  getCategorias,
  getCategoriaPorSlug,
  getProductosPorCategoria,
  getProductosPorCategorias,
  getProductosActivos,
  getProductoPorId,
  getConfig,
  getBanners,
  getPopup,
  getDistritos,
  getOcasiones,
  getTags,
  getProductosPorTag,
  getTagPorClave,
  getTodosProductosPorTag,
  getColecciones,
  getPedidos,
  type CrearPedidoInput,
} from "@/lib/queries";

const sampleInput: CrearPedidoInput = {
  nombre_cliente: "María García",
  telefono: "999600482",
  email: "maria@correo.com",
  distrito_id: "550e8400-e29b-41d4-a716-446655440000",
  direccion: "Av. Larco 1234",
  referencia: "Piso 3",
  fecha_entrega: "2026-10-15",
  hora_entrega: "manana",
  notas: "Con tarjeta",
  productos: [
    {
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
      cantidad: 1,
    },
  ],
  subtotal: 120,
  delivery: 10,
  total: 130,
};

describe("crearPedido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("éxito al primer intento: genera FM-XXXXXX y llama a insert una sola vez", async () => {
    insertMock.mockResolvedValueOnce({ error: null });

    const numero = await crearPedido(sampleInput);

    expect(numero).toMatch(/^FM-\d{6}$/);
    expect(fromMock).toHaveBeenCalledWith("pedidos");
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        numero,
        nombre_cliente: "María García",
        estado: "pendiente",
        subtotal: 120,
        delivery: 10,
        total: 130,
      }),
    );
  });

  it("duplicado (código 23505) y luego éxito: reintenta y genera un nuevo número en el segundo intento", async () => {
    insertMock
      .mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      })
      .mockResolvedValueOnce({ error: null });

    const numero = await crearPedido(sampleInput);

    expect(numero).toMatch(/^FM-\d{6}$/);
    expect(insertMock).toHaveBeenCalledTimes(2);
  });

  it("3 duplicados seguidos (código 23505): falla tras 3 intentos y ofrece mensaje con WhatsApp", async () => {
    insertMock
      .mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      })
      .mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      })
      .mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      });

    await expect(crearPedido(sampleInput)).rejects.toThrow(
      /No pudimos generar un número de pedido único tras 3 intentos.*WhatsApp.*\+51 999 600 482/,
    );
    expect(insertMock).toHaveBeenCalledTimes(3);
  });

  it("error distinto de 23505: lanza de inmediato y NO reintenta (1 solo intento)", async () => {
    insertMock.mockResolvedValueOnce({
      error: { code: "42501", message: "permission denied for table pedidos" },
    });

    await expect(crearPedido(sampleInput)).rejects.toThrow(
      "[Supabase] permission denied for table pedidos",
    );
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});

describe("Consultas de lectura en queries.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = { data: [], error: null };
    tableResults = {};
  });

  it("getTodasCategoriasActivas devuelve lista ordenada", async () => {
    queryResult = {
      data: [{ id: "cat-1", nombre: "Ramos", activo: true, orden: 1 }],
      error: null,
    };
    const res = await getTodasCategoriasActivas();
    expect(res).toHaveLength(1);
    expect(fromMock).toHaveBeenCalledWith("categorias");
  });

  it("getCategoriaIdsConProductosActivos extrae IDs no nulos", async () => {
    queryResult = {
      data: [{ categoria_id: "cat-1" }, { categoria_id: null }, { categoria_id: "cat-2" }],
      error: null,
    };
    const res = await getCategoriaIdsConProductosActivos();
    expect(res).toEqual(["cat-1", "cat-2"]);
  });

  it("getCategoriaPorSlug devuelve categoría con sus hijas o null", async () => {
    chainMock.maybeSingle = vi.fn().mockResolvedValueOnce({
      data: { id: "cat-padre", slug: "nacimientos", nombre: "Nacimientos" },
      error: null,
    });
    queryResult = {
      data: [{ id: "cat-hija", slug: "nino", parent_id: "cat-padre" }],
      error: null,
    };

    const res = await getCategoriaPorSlug("nacimientos");
    expect(res).not.toBeNull();
    expect(res?.slug).toBe("nacimientos");
    expect(res?.hijas).toHaveLength(1);

    // Cuando no existe
    chainMock.maybeSingle = vi.fn().mockResolvedValueOnce({ data: null, error: null });
    const resNull = await getCategoriaPorSlug("inexistente");
    expect(resNull).toBeNull();
  });

  it("getProductosPorCategoria y getProductosPorCategorias retornan productos", async () => {
    queryResult = {
      data: [{ id: "p1", nombre: "Tulipanes Rojos", activo: true }],
      error: null,
    };
    const porCat = await getProductosPorCategoria("cat-1");
    expect(porCat).toHaveLength(1);

    // Vacío
    const vacio = await getProductosPorCategorias([]);
    expect(vacio).toEqual([]);

    // Con IDs
    const conIds = await getProductosPorCategorias(["cat-1", "cat-2"]);
    expect(conIds).toHaveLength(1);
  });

  it("getProductosActivos devuelve todos los productos", async () => {
    queryResult = {
      data: [{ id: "p1", activo: true, orden: 0 }],
      error: null,
    };
    const res = await getProductosActivos();
    expect(res).toHaveLength(1);
  });

  it("getProductoPorId maneja UUIDs y fallback local si no es UUID", async () => {
    // UUID válido
    const testUuid = "550e8400-e29b-41d4-a716-446655440000";
    chainMock.maybeSingle = vi.fn().mockResolvedValueOnce({
      data: { id: testUuid, nombre: "Producto DB" },
      error: null,
    });
    const deDb = await getProductoPorId(testUuid);
    expect(deDb?.nombre).toBe("Producto DB");

    // Slug estático no UUID que existe en catalog.ts
    const local = await getProductoPorId("box-romantico");
    expect(local).not.toBeNull();
    expect(local?.nombre).toBe("Box Romántico");

    // Slug que no existe en catalog.ts
    const localInexistente = await getProductoPorId("slug-inexistente-total");
    expect(localInexistente).toBeNull();
  });

  it("getConfig, getBanners, getPopup, getDistritos y getOcasiones consultan sus tablas", async () => {
    chainMock.maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "conf-1", whatsapp: "+51 999 600 482" },
      error: null,
    });
    queryResult = { data: [{ id: "1" }], error: null };

    const conf = await getConfig();
    expect(conf).not.toBeNull();

    const banners = await getBanners();
    expect(banners).toHaveLength(1);

    const popup = await getPopup();
    expect(popup).not.toBeNull();

    const distritos = await getDistritos();
    expect(distritos).toHaveLength(1);

    const ocasiones = await getOcasiones();
    expect(ocasiones).toHaveLength(1);
  });

  it("getTags, getProductosPorTag, getTagPorClave, getTodosProductosPorTag y getPedidos", async () => {
    queryResult = { data: [{ clave: "amor", nombre: "Amor" }], error: null };
    chainMock.maybeSingle = vi.fn().mockResolvedValue({
      data: { clave: "amor", nombre: "Amor" },
      error: null,
    });

    const tags = await getTags();
    expect(tags).toHaveLength(1);

    const prodPorTag = await getProductosPorTag("amor", 5);
    expect(prodPorTag).toHaveLength(1);

    const tagUnico = await getTagPorClave("amor");
    expect(tagUnico?.clave).toBe("amor");

    const todosProd = await getTodosProductosPorTag("amor");
    expect(todosProd).toHaveLength(1);

    const pedidos = await getPedidos();
    expect(pedidos).toHaveLength(1);
  });

  it("getCategorias filtra categorias visibles basadas en productos", async () => {
    tableResults = {
      categorias: {
        data: [
          { id: "cat-1", slug: "ramos", activo: true, orden: 1, parent_id: null },
          { id: "cat-2", slug: "vacia", activo: true, orden: 2, parent_id: null },
        ],
        error: null,
      },
      productos: {
        data: [{ categoria_id: "cat-1" }],
        error: null,
      },
    };

    const categorias = await getCategorias();
    expect(categorias.some((c) => c.slug === "ramos")).toBe(true);
    expect(categorias.some((c) => c.slug === "vacia")).toBe(false);
  });

  it("getColecciones recupera colecciones activas, resuelve categorías y complementa", async () => {
    tableResults = {
      colecciones_home: {
        data: [
          {
            id: "col-1",
            categoria_id: "cat-hija-1",
            orden: 1,
            activo: true,
            categoria: {
              id: "cat-hija-1",
              nombre: "Rosas Rojas",
              slug: "rosas-rojas",
              parent_id: "cat-padre-1",
            },
          },
        ],
        error: null,
      },
      categorias: {
        data: [
          {
            id: "cat-padre-1",
            nombre: "Amor y Aniversario",
            slug: "amor-aniversario",
            activo: true,
            orden: 0,
            parent_id: null,
          },
          {
            id: "cat-hija-1",
            nombre: "Rosas Rojas",
            slug: "rosas-rojas",
            activo: true,
            orden: 1,
            parent_id: "cat-padre-1",
          },
          {
            id: "cat-destacada-2",
            nombre: "Cumpleaños",
            slug: "cumpleanos",
            activo: true,
            orden: 2,
            parent_id: null,
          },
        ],
        error: null,
      },
      productos: {
        data: [{ categoria_id: "cat-hija-1" }, { categoria_id: "cat-destacada-2" }],
        error: null,
      },
    };

    const colecciones = await getColecciones();
    expect(colecciones.length).toBeGreaterThanOrEqual(1);
    expect(colecciones[0].categoria).toBeDefined();
    // Verifica que inyectó el slug del padre
    const conPadre = colecciones.find((c) => c.id === "col-1");
    expect((conPadre?.categoria as { padre?: { slug: string } })?.padre?.slug).toBe(
      "amor-aniversario",
    );
  });

  it("throwOnError lanza error ante fallo de Supabase o datos nulos", async () => {
    queryResult = { data: null, error: { message: "Error forzado" } };
    await expect(getBanners()).rejects.toThrow("[Supabase] Error forzado");

    queryResult = { data: null, error: null };
    await expect(getBanners()).rejects.toThrow("[Supabase] La consulta no devolvió datos");
  });
});
