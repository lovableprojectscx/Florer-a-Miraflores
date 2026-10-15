import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterSelect, ProductFiltersBar, useProductFilters } from "@/components/ProductFilters";
import { getCategorias, getConfig, getProductosActivos } from "@/lib/queries";
import type { CategoriaRow, ProductoRow } from "@/types/database";

export const Route = createFileRoute("/catalogo")({
  loader: async () => {
    const [productos, categorias, config] = await Promise.all([
      getProductosActivos().catch(() => []),
      getCategorias(),
      getConfig().catch(() => null),
    ]);
    return { productos, categorias, config };
  },
  head: () => ({
    meta: [
      { title: "Catálogo | Florería Miraflores" },
      {
        name: "description",
        content:
          "Explora el catálogo completo de Florería Miraflores. Filtra por categoría, ocasión y precio. Delivery en Miraflores, Surco, Barranco, Lince y San Isidro.",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-3xl mb-2 text-[#2C2420]">Algo salió mal</h1>
      <p className="text-[#8A7A6E]">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  ),
  component: CatalogoPage,
});

function CatalogoPage() {
  const { productos, categorias, config } = Route.useLoaderData();

  // Categorías padre (colecciones) y subcategorías de "Ocasión"
  const padres = categorias.filter((c: CategoriaRow) => !c.parent_id);
  const ocasionPadre = padres.find((c: CategoriaRow) => c.slug === "ocasion");
  const ocasiones = ocasionPadre
    ? categorias.filter((c: CategoriaRow) => c.parent_id === ocasionPadre.id)
    : [];

  const [catFiltro, setCatFiltro] = useState("todas");
  const [ocasionFiltro, setOcasionFiltro] = useState("todas");
  const [subFiltro, setSubFiltro] = useState("todas");

  // Subcategorías de la categoría padre seleccionada (si aplica)
  const subcategorias = useMemo(() => {
    if (catFiltro === "todas") return [];
    return categorias.filter((c: CategoriaRow) => c.parent_id === catFiltro && c.activo);
  }, [catFiltro, categorias]);

  // Filtro por categoría y subcategoría
  const porCategoria = useMemo(() => {
    let out = productos;

    if (catFiltro !== "todas") {
      if (subFiltro !== "todas") {
        out = out.filter((p: ProductoRow) => p.categoria_id === subFiltro);
      } else {
        const idsValidos = new Set([
          catFiltro,
          ...categorias
            .filter((c: CategoriaRow) => c.parent_id === catFiltro)
            .map((c: CategoriaRow) => c.id),
        ]);
        out = out.filter((p: ProductoRow) => p.categoria_id && idsValidos.has(p.categoria_id));
      }
    } else if (ocasionFiltro !== "todas") {
      out = out.filter((p: ProductoRow) => p.categoria_id === ocasionFiltro);
    }

    return out;
  }, [productos, categorias, catFiltro, subFiltro, ocasionFiltro]);

  const { filtrados, orden, setOrden, rango, setRango } = useProductFilters(porCategoria);

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      {config && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 pt-4 md:pt-6 pb-12 md:pb-16">
        {/* Ruta + Eyebrow en una línea */}
        <nav
          aria-label="Ruta de navegación"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-2 md:mb-3"
        >
          <Link to="/" className="hover:text-[#2C2420] transition-colors">
            Inicio
          </Link>
          <span aria-hidden className="text-[#8A7A6E]/60">
            /
          </span>
          <span className="text-[#2C2420]">Catálogo</span>
          <span className="text-rose-accent font-italic-serif lowercase tracking-normal text-xs md:text-sm">
            — toda la colección
          </span>
        </nav>

        {/* Franja compacta: Título + Filtros */}
        <ProductFiltersBar
          titulo="Catálogo"
          total={filtrados.length}
          orden={orden}
          onOrdenChange={setOrden}
          rango={rango}
          onRangoChange={setRango}
        >
          <FilterSelect
            label="Categoría"
            value={catFiltro}
            onChange={(v) => {
              setCatFiltro(v);
              setSubFiltro("todas");
              if (v !== "todas" && v !== ocasionPadre?.id) setOcasionFiltro("todas");
            }}
            options={[
              { value: "todas", label: "Todas las categorías" },
              ...padres.map((c: CategoriaRow) => ({ value: c.id, label: c.nombre })),
            ]}
          />

          {subcategorias.length > 0 ? (
            <FilterSelect
              label="Subcategoría"
              value={subFiltro}
              onChange={setSubFiltro}
              options={[
                { value: "todas", label: "Todas las opciones" },
                ...subcategorias.map((c: CategoriaRow) => ({ value: c.id, label: c.nombre })),
              ]}
            />
          ) : ocasiones.length > 0 && catFiltro === "todas" ? (
            <FilterSelect
              label="Ocasión"
              value={ocasionFiltro}
              onChange={(v) => {
                setOcasionFiltro(v);
              }}
              options={[
                { value: "todas", label: "Todas las ocasiones" },
                ...ocasiones.map((c: CategoriaRow) => ({ value: c.id, label: c.nombre })),
              ]}
            />
          ) : null}
        </ProductFiltersBar>

        {/* Grid de productos */}
        {filtrados.length > 0 ? (
          <ProductGrid products={filtrados} tamanoLote={24} />
        ) : (
          <section className="border border-[#E8DDD0] p-8 md:p-16 bg-[#F5EFE6]/40 text-center">
            <p className="font-italic-serif text-rose-accent mb-2">— sin resultados</p>
            <p className="font-body font-light text-[#2C2420]/75 max-w-md mx-auto">
              No encontramos productos con esos filtros. Prueba con otra combinación o escríbenos
              para una pieza personalizada.
            </p>
            <a
              href={`https://wa.me/${(config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block h-12 px-8 bg-[#2C2420] text-white text-[11px] tracking-widest uppercase font-body font-light leading-[3rem]"
            >
              Consultar por WhatsApp
            </a>
          </section>
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
