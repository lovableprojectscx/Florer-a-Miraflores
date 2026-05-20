import { createFileRoute, Link, notFound, Outlet, useMatches } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { getCategoriaPorSlug, getCategorias, getConfig } from "@/lib/queries";
import type { CategoriaRow } from "@/types/database";

export const Route = createFileRoute("/categoria/$slug")({
  loader: async ({ params }) => {
    const [cat, categorias, config] = await Promise.all([
      getCategoriaPorSlug(params.slug),
      getCategorias(),
      getConfig().catch(() => null),
    ]);
    if (!cat) throw notFound();
    return { cat, categorias, config };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.cat.nombre} | Florería Miraflores` },
          {
            name: "description",
            content: `Explora ${loaderData.cat.nombre} en Florería Miraflores. Delivery en Lima.`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-4xl mb-4 text-[#2C2420]">Categoría no encontrada</h1>
      <Link to="/" className="text-[#C4956A] underline">
        Volver al inicio
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-3xl mb-2 text-[#2C2420]">Algo salió mal</h1>
      <p className="text-[#8A7A6E]">{error.message}</p>
    </div>
  ),
  component: CategoriaPage,
});

function CategoriaPage() {
  const { cat, categorias, config } = Route.useLoaderData();
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/categoria/$slug/$sub");
  if (hasChild) return <Outlet />;

  const hermanas = categorias.filter((c: CategoriaRow) => !c.parent_id && c.slug !== cat.slug);

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <AnnouncementBar config={config} />
      <Header categorias={categorias} />

      <main className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 py-10 md:py-16">
        <nav className="text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-[#2C2420] transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <span className="text-[#2C2420]">{cat.nombre}</span>
        </nav>

        <header className="max-w-2xl mb-10 md:mb-16">
          <p className="font-italic-serif text-rose-accent text-base md:text-lg mb-2">
            — colección
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-[#2C2420] leading-tight">
            {cat.nombre}
          </h1>
        </header>

        {cat.hijas.length > 0 ? (
          <section>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {cat.hijas.map((sub: CategoriaRow) => (
                <Link
                  key={sub.id}
                  to="/categoria/$slug/$sub"
                  params={{ slug: cat.slug, sub: sub.slug }}
                  className="group relative overflow-hidden bg-[#F5EFE6] aspect-[4/3] flex items-end p-4 md:p-6 border border-[#E8DDD0] hover:border-[#C4956A] transition-colors"
                >
                  {sub.imagen_url && (
                    <img
                      src={sub.imagen_url}
                      alt={sub.nombre}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity"
                    />
                  )}
                  <div className="relative z-10">
                    <h3 className="font-display text-lg md:text-2xl text-[#2C2420] leading-tight">
                      {sub.nombre}
                    </h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-body font-light text-[#8A7A6E] group-hover:text-[#C4956A] transition-colors">
                      Ver <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="border border-[#E8DDD0] p-8 md:p-12 bg-[#F5EFE6]/40 text-center">
            <p className="font-italic-serif text-rose-accent mb-2">— próximamente</p>
            <p className="font-body font-light text-[#2C2420]/75">
              Estamos preparando la colección. Mientras tanto, consulta por WhatsApp.
            </p>
            <a
              href="https://wa.me/51999600482"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block h-12 px-8 bg-[#2C2420] text-white text-[11px] tracking-widest uppercase font-body font-light leading-[3rem]"
            >
              Consultar
            </a>
          </section>
        )}

        {hermanas.length > 0 && (
          <section className="mt-16 md:mt-24 border-t border-[#E8DDD0] pt-10">
            <p className="text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-4">
              Otras colecciones
            </p>
            <div className="flex flex-wrap gap-2">
              {hermanas.map((c: CategoriaRow) => (
                <Link
                  key={c.id}
                  to="/categoria/$slug"
                  params={{ slug: c.slug }}
                  className="px-4 py-2 border border-[#E8DDD0] text-xs tracking-widest uppercase font-body font-light text-[#2C2420] hover:bg-[#2C2420] hover:text-white transition-colors"
                >
                  {c.nombre}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab />
    </div>
  );
}
