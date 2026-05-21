import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
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
            content: loaderData.tag.descripcion || `Explora la colección ${loaderData.tag.nombre} en Florería Miraflores. Delivery en Lima.`,
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
      <p className="text-[#8A7A6E]">{error.message}</p>
    </div>
  ),
  component: TagPage,
});

function TagPage() {
  const { tag, categorias, config, productos } = Route.useLoaderData();

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
          <span className="text-[#2C2420]">{tag.nombre}</span>
        </nav>

        {/* Encabezado */}
        <header className="max-w-2xl mb-10 md:mb-16">
          <p className="font-italic-serif text-rose-accent text-base md:text-lg mb-2">
            — colección especial
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-[#2C2420] leading-tight">
            {tag.nombre}
          </h1>
          {tag.descripcion && (
            <p className="mt-4 font-body font-light text-[#8A7A6E] text-sm md:text-base leading-relaxed">
              {tag.descripcion}
            </p>
          )}
        </header>

        {productos && productos.length > 0 ? (
          <section>
            <ProductGrid products={productos} />
          </section>
        ) : (
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
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
