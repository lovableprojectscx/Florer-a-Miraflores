import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductFiltersBar, useProductFilters } from "@/components/ProductFilters";
import { getTagPorClave, getTodosProductosPorTag, getCategorias, getConfig } from "@/lib/queries";

export const Route = createFileRoute("/tag/$key")({
  loader: async ({ params }) => {
    const [tag, categorias, config] = await Promise.all([
      getTagPorClave(params.key),
      getCategorias(),
      getConfig().catch(() => null),
    ]);
    if (!tag) throw notFound();

    const productos = await getTodosProductosPorTag(tag.clave).catch(() => []);

    return { tag, categorias, config, productos };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.tag.nombre} | Florería Miraflores` },
          {
            name: "description",
            content:
              loaderData.tag.descripcion ||
              `Explora la colección ${loaderData.tag.nombre} en Florería Miraflores. Delivery en Lima.`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#FDFAF6]">
      <h1 className="font-display text-4xl mb-4 text-[#2C2420]">Colección no encontrada</h1>
      <Link to="/" className="text-[#C4956A] underline">
        Volver al inicio
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#FDFAF6]">
      <h1 className="font-display text-3xl mb-2 text-[#2C2420]">Algo salió mal</h1>
      <p className="text-[#8A7A6E]">{error instanceof Error ? error.message : String(error)}</p>
    </div>
  ),
  component: TagPage,
});

function TagPage() {
  const { tag, categorias, config, productos } = Route.useLoaderData();

  // Filtros de precio y orden
  const { filtrados, orden, setOrden, rango, setRango } = useProductFilters(productos);

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
          <span className="text-[#2C2420]">{tag.nombre}</span>
          <span className="text-rose-accent font-italic-serif lowercase tracking-normal text-xs md:text-sm">
            — colección especial
          </span>
        </nav>

        {productos && productos.length > 0 ? (
          <section>
            <ProductFiltersBar
              titulo={tag.nombre}
              descripcion={tag.descripcion}
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
          </section>
        ) : (
          <div>
            <h1 className="font-display text-2xl sm:text-[26px] md:text-[32px] lg:text-[34px] text-[#2C2420] leading-tight mb-6">
              {tag.nombre}
            </h1>
            <section className="border border-[#E8DDD0] p-8 md:p-12 bg-[#F5EFE6]/40 text-center">
              <p className="font-italic-serif text-rose-accent mb-2">— próximamente</p>
              <p className="font-body font-light text-[#2C2420]/75">
                Estamos preparando la colección. Mientras tanto, consulta por WhatsApp.
              </p>
              <a
                href={`https://wa.me/${(config?.whatsapp ?? "+51 999 600 482").replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block h-12 px-8 bg-[#2C2420] text-white text-[11px] tracking-widest uppercase font-body font-light leading-[3rem]"
              >
                Consultar
              </a>
            </section>
          </div>
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
