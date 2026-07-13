import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterSelect, ProductFiltersBar, useProductFilters } from "@/components/ProductFilters";
import { getCategorias, getConfig, getProductosActivos } from "@/lib/queries";
import type { CategoriaRow } from "@/types/database";

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
      <p className="text-[#8A7A6E]">{error.message}</p>
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

  // Filtro por categoría: el producto pertenece si su categoria_id es el padre
  // seleccionado o una de sus subcategorías.
  const porCategoria = useMemo(() => {
    let out = productos;

    if (catFiltro !== "todas") {
      const idsValidos = new Set([
        catFiltro,
        ...categorias
          .filter((c: CategoriaRow) => c.parent_id === catFiltro)
          .map((c: CategoriaRow) => c.id),
      ]);
      out = out.filter((p) => p.categoria_id && idsValidos.has(p.categoria_id));
    }

    if (ocasionFiltro !== "todas") {
      out = out.filter((p) => p.categoria_id === ocasionFiltro);
    }

    return out;
  }, [productos, categorias, catFiltro, ocasionFiltro]);

  const { filtrados, orden, setOrden, rango, setRango } = useProductFilters(porCategoria);

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      {config && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav className="text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#2C2420] transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <span className="text-[#2C2420]">Catálogo</span>
        </nav>

        {/* Encabezado */}
        <header className="max-w-2xl mb-10 md:mb-14">
          <p className="font-italic-serif text-rose-accent text-base md:text-lg mb-2">
            — toda la colección
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-[#2C2420] leading-tight">
            Catálogo
          </h1>
        </header>

        {/* Filtros: categoría, ocasión y precio */}
        <ProductFiltersBar
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
              // Ocasión es una categoría: al elegir otra colección, limpiamos ese filtro
              if (v !== "todas" && v !== ocasionPadre?.id) setOcasionFiltro("todas");
            }}
            options={[
              { value: "todas", label: "Todas las categorías" },
              ...padres.map((c: CategoriaRow) => ({ value: c.id, label: c.nombre })),
            ]}
          />
          {ocasiones.length > 0 && (
            <FilterSelect
              label="Ocasión"
              value={ocasionFiltro}
              onChange={(v) => {
                setOcasionFiltro(v);
                if (v !== "todas" && ocasionPadre) setCatFiltro(ocasionPadre.id);
              }}
              options={[
                { value: "todas", label: "Todas las ocasiones" },
                ...ocasiones.map((c: CategoriaRow) => ({ value: c.id, label: c.nombre })),
              ]}
            />
          )}
        </ProductFiltersBar>

        {/* Grid de productos */}
        {filtrados.length > 0 ? (
          <ProductGrid products={filtrados} />
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
