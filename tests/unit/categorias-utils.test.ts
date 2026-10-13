import { describe, expect, it } from "vitest";
import type { CategoriaRow } from "@/types/database";
import {
  armarOpcionesCategoriaSelect,
  buscarConflictoSlugCategoria,
  calcularConteoProductosPorCategoria,
  filtrarCategoriasVisibles,
  formatearErrorGuardadoCategoria,
  resolverRedireccionSubcategoria,
} from "@/lib/categorias-utils";

function makeCat(
  overrides: Partial<CategoriaRow> & Pick<CategoriaRow, "id" | "nombre" | "slug">,
): CategoriaRow {
  return {
    imagen_url: null,
    parent_id: null,
    orden: 0,
    activo: true,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("filtrarCategoriasVisibles", () => {
  it("1. padre con productos directos -> visible", () => {
    const ofertas = makeCat({ id: "cat-ofertas", nombre: "Ofertas", slug: "ofertas" });
    const res = filtrarCategoriasVisibles([ofertas], ["cat-ofertas"]);
    expect(res.map((c) => c.id)).toEqual(["cat-ofertas"]);
  });

  it("2. padre con 0 directos pero 1 hija con productos -> padre e hija con productos visibles", () => {
    const padre = makeCat({ id: "cat-orq", nombre: "Orquídeas", slug: "orquideas" });
    const hijaConProd = makeCat({
      id: "cat-orq-plantas",
      nombre: "Plantas",
      slug: "plantas-orquideas",
      parent_id: "cat-orq",
    });
    const res = filtrarCategoriasVisibles([padre, hijaConProd], ["cat-orq-plantas"]);
    expect(res.map((c) => c.id)).toEqual(["cat-orq", "cat-orq-plantas"]);
  });

  it("3. padre con 0 directos y todas las hijas con 0 (caso Defunción) -> ni padre ni hijas visibles", () => {
    const defuncion = makeCat({ id: "cat-def", nombre: "Defunción", slug: "defuncion" });
    const coronas = makeCat({
      id: "cat-coronas",
      nombre: "Coronas",
      slug: "coronas",
      parent_id: "cat-def",
    });
    const lagrimas = makeCat({
      id: "cat-lagrimas",
      nombre: "Lágrimas",
      slug: "lagrimas",
      parent_id: "cat-def",
    });
    const res = filtrarCategoriasVisibles([defuncion, coronas, lagrimas], []);
    expect(res).toEqual([]);
  });

  it("4. padre con productos directos y una hija con 0 (caso Tulipanes -> Ramos o Nacimientos -> Niño vacío) -> padre visible, hija vacía NO visible", () => {
    const nacimientos = makeCat({
      id: "cat-nac",
      nombre: "Nacimientos",
      slug: "nacimientos",
    });
    const nino = makeCat({
      id: "cat-nino",
      nombre: "Niño",
      slug: "nacimientos-nino",
      parent_id: "cat-nac",
    });
    const nina = makeCat({
      id: "cat-nina",
      nombre: "Niña",
      slug: "nacimientos-nina",
      parent_id: "cat-nac",
    });

    const res = filtrarCategoriasVisibles([nacimientos, nino, nina], ["cat-nac"]);
    expect(res.map((c) => c.id)).toEqual(["cat-nac"]);
  });

  it("5. categoría inactiva con productos -> NO visible (ni sus hijas si el padre está inactivo)", () => {
    const inactivaConProd = makeCat({
      id: "cat-inactiva",
      nombre: "Inactiva",
      slug: "inactiva",
      activo: false,
    });
    const hijaDeInactiva = makeCat({
      id: "cat-hija-inactiva",
      nombre: "Hija",
      slug: "hija",
      parent_id: "cat-inactiva",
      activo: true,
    });

    const res = filtrarCategoriasVisibles(
      [inactivaConProd, hijaDeInactiva],
      ["cat-inactiva", "cat-hija-inactiva"],
    );
    expect(res).toEqual([]);
  });

  it("6. lista vacía -> []", () => {
    expect(filtrarCategoriasVisibles([], ["cualquier-id"])).toEqual([]);
  });
});

describe("armarOpcionesCategoriaSelect", () => {
  const arreglosFlorales = makeCat({
    id: "p-af",
    nombre: "Arreglos Florales",
    slug: "arreglos-florales",
    orden: 0,
  });
  const ramosAf = makeCat({
    id: "h-ramos-af",
    nombre: "Ramos",
    slug: "ramos",
    parent_id: "p-af",
    orden: 1,
  });
  const tulipanes = makeCat({
    id: "p-tul",
    nombre: "Tulipanes",
    slug: "tulipanes",
    orden: 2,
  });
  const ramosTul = makeCat({
    id: "h-ramos-tul",
    nombre: "Ramos",
    slug: "ramos-tulipanes",
    parent_id: "p-tul",
    orden: 1,
  });
  const ofertas = makeCat({
    id: "p-ofertas",
    nombre: "Ofertas",
    slug: "ofertas",
    orden: 6,
  });
  const inactivaSub = makeCat({
    id: "h-inactiva",
    nombre: "Edición Especial",
    slug: "edicion-especial",
    parent_id: "p-tul",
    orden: 2,
    activo: false,
  });

  it("genera etiquetas 'Padre › Hija' sin duplicados para subcategorías con el mismo nombre y marca inactivas", () => {
    const grupos = armarOpcionesCategoriaSelect([
      arreglosFlorales,
      ramosAf,
      tulipanes,
      ramosTul,
      ofertas,
      inactivaSub,
    ]);

    const todasLasOpciones = grupos.flatMap((g) => g.options);
    const etiquetas = todasLasOpciones.map((o) => o.label);

    // No hay etiquetas duplicadas
    expect(new Set(etiquetas).size).toBe(etiquetas.length);

    // "Ramos" bajo Arreglos Florales != "Ramos" bajo Tulipanes
    const optRamosAf = todasLasOpciones.find((o) => o.id === "h-ramos-af");
    const optRamosTul = todasLasOpciones.find((o) => o.id === "h-ramos-tul");
    expect(optRamosAf?.label).toBe("Arreglos Florales › Ramos");
    expect(optRamosTul?.label).toBe("Tulipanes › Ramos");
    expect(optRamosAf?.label).not.toBe(optRamosTul?.label);

    // Padres sin hijas siguen siendo seleccionables
    const optOfertas = todasLasOpciones.find((o) => o.id === "p-ofertas");
    expect(optOfertas?.label).toBe("Ofertas");

    // Inactivas marcadas con "(inactiva)"
    const optInactiva = todasLasOpciones.find((o) => o.id === "h-inactiva");
    expect(optInactiva?.label).toBe("Tulipanes › Edición Especial (inactiva)");
  });
});

describe("buscarConflictoSlugCategoria y formatearErrorGuardadoCategoria (código 23505)", () => {
  const padreAf = makeCat({
    id: "p-af",
    nombre: "Arreglos Florales",
    slug: "arreglos-florales",
    activo: true,
  });
  const subRamosActiva = makeCat({
    id: "h-ramos",
    nombre: "Ramos",
    slug: "ramos",
    parent_id: "p-af",
    activo: true,
  });
  const subCajasInactiva = makeCat({
    id: "h-cajas",
    nombre: "Cajas",
    slug: "cajas",
    parent_id: "p-af",
    activo: false,
  });
  const lista = [padreAf, subRamosActiva, subCajasInactiva];

  it("detecta conflicto de slug con categoría activa e incluye '<Padre> › <Nombre>'", () => {
    const msg = formatearErrorGuardadoCategoria(
      { code: "23505", message: "duplicate key value violates unique constraint" },
      "ramos",
      lista,
    );
    expect(msg).toContain("Ya existe una categoría con el slug «ramos»");
    expect(msg).toContain("(está en: Arreglos Florales › Ramos)");
    expect(msg).not.toContain("inactiva");
  });

  it("detecta conflicto de slug con categoría inactiva e indica activarla en vez de crear otra", () => {
    const msg = formatearErrorGuardadoCategoria(
      { code: "23505", message: "duplicate key value violates unique constraint" },
      "cajas",
      lista,
    );
    expect(msg).toContain("Ya existe una categoría con el slug «cajas»");
    expect(msg).toContain("(está en: Arreglos Florales › Cajas)");
    expect(msg).toContain("está inactiva: actívala en vez de crear otra");
  });

  it("ignora la propia categoría cuando se está editando (ignorarId)", () => {
    expect(buscarConflictoSlugCategoria("ramos", lista, "h-ramos")).toBeNull();
  });
});

describe("calcularConteoProductosPorCategoria", () => {
  it("calcula directos, hijas y total correctamente para padres e hijas", () => {
    const padre = makeCat({ id: "p-1", nombre: "Tulipanes", slug: "tulipanes" });
    const hija1 = makeCat({
      id: "h-1",
      nombre: "Arreglos",
      slug: "arreglos-tulipanes",
      parent_id: "p-1",
    });
    const hija2 = makeCat({
      id: "h-2",
      nombre: "Ramos",
      slug: "ramos-tulipanes",
      parent_id: "p-1",
    });

    const conteos = calcularConteoProductosPorCategoria(
      [padre, hija1, hija2],
      ["p-1", "p-1", "h-1", "h-1", "h-1"],
    );

    expect(conteos["p-1"]).toEqual({ directos: 2, hijas: 3, total: 5 });
    expect(conteos["h-1"]).toEqual({ directos: 3, hijas: 0, total: 3 });
    expect(conteos["h-2"]).toEqual({ directos: 0, hijas: 0, total: 0 });
  });
});

describe("resolverRedireccionSubcategoria", () => {
  const ocasion = makeCat({ id: "p-ocasion", nombre: "Ocasión", slug: "ocasion" });
  const nacimientosPadre = makeCat({
    id: "p-nac",
    nombre: "Nacimientos",
    slug: "nacimientos",
    parent_id: null,
  });
  const ninoHija = makeCat({
    id: "h-nino",
    nombre: "Niño",
    slug: "nacimientos-nino",
    parent_id: "p-nac",
  });

  it("redirige /categoria/ocasion/nacimientos a /categoria/nacimientos cuando Nacimientos pasa a ser padre", () => {
    const redirect = resolverRedireccionSubcategoria("ocasion", "nacimientos", [
      ocasion,
      nacimientosPadre,
      ninoHija,
    ]);
    expect(redirect).toEqual({
      to: "/categoria/$slug",
      params: { slug: "nacimientos" },
      url: "/categoria/nacimientos",
    });
  });

  it("redirige a /categoria/<verdaderoPadre>/<subSlug> si la subcategoría pertenece a otro padre", () => {
    const redirect = resolverRedireccionSubcategoria("ocasion", "nacimientos-nino", [
      ocasion,
      nacimientosPadre,
      ninoHija,
    ]);
    expect(redirect).toEqual({
      to: "/categoria/$slug/$sub",
      params: { slug: "nacimientos", sub: "nacimientos-nino" },
      url: "/categoria/nacimientos/nacimientos-nino",
    });
  });

  it("devuelve null si la subcategoría ya pertenece al padre de la URL o no existe", () => {
    expect(
      resolverRedireccionSubcategoria("nacimientos", "nacimientos-nino", [
        ocasion,
        nacimientosPadre,
        ninoHija,
      ]),
    ).toBeNull();
    expect(
      resolverRedireccionSubcategoria("ocasion", "no-existe", [
        ocasion,
        nacimientosPadre,
        ninoHija,
      ]),
    ).toBeNull();
  });
});
