import { beforeEach, describe, expect, it, vi } from "vitest";

let queryCalls = 0;
let tableResults: Record<string, unknown> = {};

const methods = ["select", "eq", "order", "maybeSingle", "or", "overlaps", "in", "limit", "lte"];

function createChain(table?: string) {
  const chain: Record<string, any> = {};
  methods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });

  chain.maybeSingle = vi.fn(() => {
    const custom = table && tableResults[table];
    return Promise.resolve({ data: custom ?? { id: `${table}-1` }, error: null });
  });

  chain.then = (resolve: (val: unknown) => void, reject?: (err: unknown) => void) => {
    const custom = table && tableResults[table];
    const defaultData = [
      { id: `${table}-1`, nombre: `${table} test`, orden: 1, activo: true, parent_id: null },
    ];
    return Promise.resolve({ data: custom ?? defaultData, error: null }).then(resolve, reject);
  };

  return chain;
}

const fromMock = vi.fn((table?: string) => {
  queryCalls++;
  return createChain(table);
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...(args as [string?])),
  },
}));

import {
  clearQueryCache,
  getCategorias,
  getConfig,
  getDistritos,
  getBanners,
  getPopup,
  getAllTags,
  getProductosActivos,
  getProductosPorCategoria,
  getColecciones,
  getTestimoniosHome,
  getRecuerdosHome,
} from "@/lib/queries";

describe("Caché en memoria de consultas estáticas (src/lib/queries.ts)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearQueryCache();
    queryCalls = 0;
    tableResults = {};
  });

  it("getCategorias almacena en caché y no vuelve a consultar Supabase en llamadas sucesivas", async () => {
    tableResults["categorias"] = [
      { id: "cat-1", nombre: "Rosas", orden: 1, activo: true, parent_id: null },
    ];
    tableResults["productos"] = [{ categoria_id: "cat-1" }];

    // Primera llamada: debe consultar la BD
    const res1 = await getCategorias();
    expect(res1).toHaveLength(1);
    expect(res1[0].id).toBe("cat-1");
    const callsAfterFirst = queryCalls;
    expect(callsAfterFirst).toBeGreaterThan(0);

    // Segunda llamada inmediata: debe responder desde memoria (0 llamadas nuevas a Supabase)
    const res2 = await getCategorias();
    expect(res2).toHaveLength(1);
    expect(queryCalls).toBe(callsAfterFirst);

    // Tercera llamada: sigue en caché
    const res3 = await getCategorias();
    expect(res3).toEqual(res1);
    expect(queryCalls).toBe(callsAfterFirst);
  });

  it("clearQueryCache invalida la caché forzando una nueva consulta a Supabase", async () => {
    tableResults["categorias"] = [
      { id: "cat-1", nombre: "Rosas", orden: 1, activo: true, parent_id: null },
    ];
    tableResults["productos"] = [{ categoria_id: "cat-1" }];

    await getCategorias();
    const calls1 = queryCalls;

    // Purgar la caché manualmente
    clearQueryCache();

    // Siguiente llamada debe volver a consultar
    await getCategorias();
    expect(queryCalls).toBeGreaterThan(calls1);
  });

  it("getConfig se almacena en caché y no repite la consulta a la tabla config", async () => {
    tableResults["config"] = { id: "conf-1", whatsapp: "+51 999 600 482" };

    const conf1 = await getConfig();
    expect(conf1?.id).toBe("conf-1");
    const calls1 = queryCalls;

    const conf2 = await getConfig();
    expect(conf2?.id).toBe("conf-1");
    expect(queryCalls).toBe(calls1);
  });

  it("getDistritos y getBanners utilizan caché en memoria", async () => {
    tableResults["distritos"] = [{ id: "dist-1", nombre: "Miraflores", activo: true }];
    tableResults["banners"] = [{ id: "ban-1", activo: true, orden: 1 }];

    const dist1 = await getDistritos();
    expect(dist1).toHaveLength(1);
    const callsDist = queryCalls;

    // Llamada 2 a distritos: servida por caché
    await getDistritos();
    expect(queryCalls).toBe(callsDist);

    const ban1 = await getBanners();
    expect(ban1).toHaveLength(1);
    const callsBan = queryCalls;

    // Llamada 2 a banners: servida por caché
    await getBanners();
    expect(queryCalls).toBe(callsBan);
  });

  it("getAllTags se almacena en caché para evitar consultas redundantes en montajes de tarjetas", async () => {
    tableResults["tags"] = [
      { id: "tag-1", clave: "amor", nombre: "Amor", activo: true },
      { id: "tag-2", clave: "novedad", nombre: "Novedad", activo: true },
    ];

    const tags1 = await getAllTags();
    expect(tags1).toHaveLength(2);
    const calls1 = queryCalls;

    const tags2 = await getAllTags();
    expect(tags2).toHaveLength(2);
    expect(queryCalls).toBe(calls1);
  });

  it("getProductosActivos utiliza caché en memoria y evita re-consultar el catálogo masivo", async () => {
    tableResults["productos"] = [
      { id: "prod-1", nombre: "Rosas Rojas", precio: 80, activo: true, orden: 1 },
      { id: "prod-2", nombre: "Tulipanes Blancos", precio: 110, activo: true, orden: 2 },
    ];

    const prods1 = await getProductosActivos();
    expect(prods1).toHaveLength(2);
    const calls1 = queryCalls;

    const prods2 = await getProductosActivos();
    expect(prods2).toHaveLength(2);
    expect(queryCalls).toBe(calls1);
  });

  it("getProductosPorCategoria almacena en memoria según el ID de categoría", async () => {
    tableResults["productos"] = [
      { id: "prod-1", categoria_id: "cat-tulipanes", nombre: "Ramo Tulipanes", activo: true },
    ];

    const prods1 = await getProductosPorCategoria("cat-tulipanes");
    expect(prods1).toHaveLength(1);
    const calls1 = queryCalls;

    // Misma categoría -> responde desde memoria
    const prods2 = await getProductosPorCategoria("cat-tulipanes");
    expect(prods2).toHaveLength(1);
    expect(queryCalls).toBe(calls1);
  });

  it("getColecciones utiliza caché en memoria evitando múltiples joins repetidos", async () => {
    tableResults["colecciones_home"] = [
      {
        id: "col-1",
        categoria_id: "cat-1",
        activo: true,
        orden: 1,
        categoria: { id: "cat-1", slug: "amor-aniversario", activo: true },
      },
    ];
    tableResults["categorias"] = [
      { id: "cat-1", slug: "amor-aniversario", activo: true, orden: 1, parent_id: null },
    ];
    tableResults["productos"] = [{ categoria_id: "cat-1" }];

    const cols1 = await getColecciones();
    expect(cols1).toHaveLength(1);
    const calls1 = queryCalls;

    const cols2 = await getColecciones();
    expect(cols2).toHaveLength(1);
    expect(queryCalls).toBe(calls1);
  });

  it("getTestimoniosHome y getRecuerdosHome utilizan caché para blindar el Home", async () => {
    tableResults["testimonios"] = [{ id: "test-1", cliente_nombre: "Lucía", activo: true }];
    tableResults["recuerdos"] = [{ id: "rec-1", titulo: "Cumpleaños", publicado: true }];

    const test1 = await getTestimoniosHome();
    expect(test1).toHaveLength(1);
    const callsTest = queryCalls;

    await getTestimoniosHome();
    expect(queryCalls).toBe(callsTest);

    const rec1 = await getRecuerdosHome(8);
    expect(rec1).toHaveLength(1);
    const callsRec = queryCalls;

    await getRecuerdosHome(8);
    expect(queryCalls).toBe(callsRec);
  });
});
