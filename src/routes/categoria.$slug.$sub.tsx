import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductFiltersBar, useProductFilters } from "@/components/ProductFilters";
import {
  getCategoriaPorSlug,
  getCategorias,
  getConfig,
  getProductosPorCategoria,
  getTodasCategoriasActivas,
} from "@/lib/queries";
import { resolverRedireccionSubcategoria } from "@/lib/categorias-utils";
import type { CategoriaRow } from "@/types/database";

export const Route = createFileRoute("/categoria/$slug/$sub")({
  loader: async ({ params }) => {
    const [cat, categorias, config] = await Promise.all([
      getCategoriaPorSlug(params.slug),
      getCategorias(),
      getConfig().catch(() => null),
    ]);

    // Buscar la subcategoría hija por slug
    const subcat = cat?.hijas.find((h) => h.slug === params.sub);
    if (!cat || !subcat) {
      const todasActivas = await getTodasCategoriasActivas().catch(() => []);
      const target = resolverRedireccionSubcategoria(params.slug, params.sub, todasActivas);
      if (target) {
        if (target.to === "/categoria/$slug") {
          throw redirect({ to: "/categoria/$slug", params: target.params });
        }
        throw redirect({ to: "/categoria/$slug/$sub", params: target.params });
      }
      throw notFound();
    }

    // Traer productos de esta subcategoría
    const productos = await getProductosPorCategoria(subcat.id);

    return { cat, subcat, categorias, config, productos };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.subcat.nombre} — ${loaderData.cat.nombre} | Florería Miraflores` },
          {
            name: "description",
            content: `${loaderData.subcat.nombre} en Florería Miraflores. Delivery en Lima.`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-4xl mb-4 text-[#2C2420]">No encontrado</h1>
      <Link to="/" className="text-[#C4956A] underline">
        Volver al inicio
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-3xl mb-2 text-[#2C2420]">Algo salió mal</h1>
      <p className="text-[#8A7A6E]">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  ),
  component: SubPage,
});

function SubPage() {
  const { cat, subcat, categorias, config, productos } = Route.useLoaderData();

  // Filtros de precio y orden
  const { filtrados, orden, setOrden, rango, setRango } = useProductFilters(productos);

  // Otras hijas visibles (con ≥1 producto activo) de la misma categoría padre
  const idsVisibles = new Set(categorias.map((c: CategoriaRow) => c.id));
  const otrasSubs = cat.hijas.filter(
    (s: CategoriaRow) => s.slug !== subcat.slug && idsVisibles.has(s.id),
  );

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <AnnouncementBar config={config} />
      <Header categorias={categorias} config={config} />

      <main className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav className="text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-6 flex flex-wrap items-center gap-1.5">
          <Link to="/" className="hover:text-[#2C2420] transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <Link
            to="/categoria/$slug"
            params={{ slug: cat.slug }}
            className="hover:text-[#2C2420] transition-colors"
          >
            {cat.nombre}
          </Link>
          <span>/</span>
          <span className="text-[#2C2420]">{subcat.nombre}</span>
        </nav>

        <header className="max-w-2xl mb-10 md:mb-16">
          <p className="font-italic-serif text-rose-accent text-base md:text-lg mb-2">
            — {cat.nombre.toLowerCase()}
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-[#2C2420] leading-tight">
            {subcat.nombre}
          </h1>
        </header>

        {/* Filtros + grid de productos */}
        {productos.length > 0 ? (
          <>
            <ProductFiltersBar
              total={filtrados.length}
              orden={orden}
              onOrdenChange={setOrden}
              rango={rango}
              onRangoChange={setRango}
            />
            {filtrados.length > 0 ? (
              <ProductGrid products={filtrados} tamanoLote={24} />
            ) : (
              <p className="font-body font-light text-sm text-[#8A7A6E] py-8 text-center">
                No hay productos en ese rango de precio.
              </p>
            )}
          </>
        ) : (
          <section className="border border-[#E8DDD0] p-8 md:p-16 bg-[#F5EFE6]/40 text-center">
            <p className="font-italic-serif text-rose-accent mb-2">— próximamente</p>
            <p className="font-body font-light text-[#2C2420]/75 max-w-md mx-auto">
              Pronto cargaremos los arreglos de esta subcategoría. Si deseas una pieza
              personalizada, escríbenos.
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

        {/* Otras subcategorías */}
        {otrasSubs.length > 0 && (
          <section className="mt-16 border-t border-[#E8DDD0] pt-10">
            <p className="text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-4">
              Más en {cat.nombre}
            </p>
            <div className="flex flex-wrap gap-2">
              {otrasSubs.map((s: CategoriaRow) => (
                <Link
                  key={s.id}
                  to="/categoria/$slug/$sub"
                  params={{ slug: cat.slug, sub: s.slug }}
                  className="px-4 py-2 border border-[#E8DDD0] text-xs tracking-widest uppercase font-body font-light text-[#2C2420] hover:bg-[#2C2420] hover:text-white transition-colors"
                >
                  {s.nombre}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
