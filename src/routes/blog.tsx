import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { getBlogPostsPublicos, getCategorias, getConfig } from "@/lib/queries";
import { formatBlogDate, calculateReadingTime } from "@/lib/blog-utils";
import { useVerMas } from "@/hooks/use-ver-mas";
import type { BlogPostRow } from "@/types/database";

export const Route = createFileRoute("/blog")({
  loader: async () => {
    const [posts, categorias, config] = await Promise.all([
      getBlogPostsPublicos().catch(() => [] as BlogPostRow[]),
      getCategorias().catch(() => []),
      getConfig().catch(() => null),
    ]);
    return { posts, categorias, config };
  },
  head: () => ({
    meta: [
      { title: "Blog de Flores y Consejos Florales | Florería Miraflores" },
      {
        name: "description",
        content:
          "Consejos de cuidado floral, guías para regalar flores en ocasiones especiales y el significado de rosas y tulipanes en Lima. Consejos de expertos floristas.",
      },
      {
        property: "og:title",
        content: "Blog de Flores y Consejos Florales | Florería Miraflores",
      },
      {
        property: "og:description",
        content:
          "Consejos de cuidado floral, guías para regalar flores en ocasiones especiales y el significado de las flores.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BlogLayoutOrIndex,
});

function BlogLayoutOrIndex() {
  const matches = useMatches();
  const hasChild = matches.some((m) => m.routeId === "/blog/$slug");

  if (hasChild) {
    return <Outlet />;
  }

  return <BlogIndexPage />;
}

function BlogIndexPage() {
  const { posts, categorias, config } = Route.useLoaderData();
  const { visibles, total, mostrando, hayMas, verMas } = useVerMas<BlogPostRow>(
    posts as BlogPostRow[],
    12,
  );

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col">
      {config && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="flex-1 max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-12 pt-4 md:pt-6 pb-16">
        {/* Ruta + Eyebrow en una línea pequeña */}
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
          <span className="text-[#2C2420]">Blog</span>
          <span className="text-rose-accent font-italic-serif lowercase tracking-normal text-xs md:text-sm">
            — historias y consejos
          </span>
        </nav>

        {/* Encabezado editorial compacto */}
        <header className="mb-8 md:mb-10 border-b border-[#E8DDD0]/70 pb-4">
          <h1 className="font-display text-2xl sm:text-[26px] md:text-[32px] lg:text-[34px] text-[#2C2420] leading-tight">
            Blog de Flores
          </h1>
          <p className="mt-1 font-body font-light text-xs md:text-sm text-[#8A7A6E] max-w-2xl">
            Guías para cuidar tus flores, elegir el regalo perfecto según la ocasión y conocer el
            significado detrás de cada ramo.
          </p>
        </header>

        {/* Lista de artículos */}
        {posts.length > 0 ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {visibles.map((post: BlogPostRow) => {
                const lecturaMin = calculateReadingTime(post.contenido);
                return (
                  <article
                    key={post.id}
                    className="group flex flex-col bg-white border border-[#E8DDD0]/70 rounded-xl overflow-hidden hover:border-[#C4956A] hover:shadow-md transition-all duration-300"
                  >
                    <Link
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="block overflow-hidden aspect-[16/9] bg-[#FAF8F5] relative"
                    >
                      {post.imagen_portada_url ? (
                        <img
                          src={post.imagen_portada_url}
                          alt={post.titulo}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#F5EFE6]/60 text-[#C4956A]">
                          <BookOpen className="w-10 h-10 stroke-[1.2]" />
                        </div>
                      )}
                    </Link>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-[11px] text-[#8A7A6E] font-body tracking-wider uppercase mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                            {formatBlogDate(post.fecha_publicacion)}
                          </span>
                          <span>•</span>
                          <span>{lecturaMin} min de lectura</span>
                        </div>

                        <h2 className="font-display text-lg md:text-xl text-[#2C2420] group-hover:text-[#C4956A] transition-colors leading-snug line-clamp-2 mb-2">
                          <Link to="/blog/$slug" params={{ slug: post.slug }}>
                            {post.titulo}
                          </Link>
                        </h2>

                        {post.resumen && (
                          <p className="font-body font-light text-xs md:text-sm text-[#8A7A6E] line-clamp-3 leading-relaxed">
                            {post.resumen}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#E8DDD0]/40">
                        <Link
                          to="/blog/$slug"
                          params={{ slug: post.slug }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2C2420] group-hover:text-[#C4956A] transition-colors uppercase tracking-widest font-body"
                        >
                          Leer artículo <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Paginación incremental */}
            {hayMas && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={verMas}
                  className="px-8 h-11 border border-[#2C2420] text-[#2C2420] text-[11px] tracking-widest uppercase font-body hover:bg-[#2C2420] hover:text-white transition-colors duration-300 rounded-lg cursor-pointer font-medium"
                >
                  Ver más ({mostrando} de {total})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            data-testid="blog-empty-state"
            className="py-16 md:py-24 text-center max-w-lg mx-auto border border-[#E8DDD0] p-8 md:p-12 bg-[#F5EFE6]/40 rounded-2xl"
          >
            <BookOpen className="w-12 h-12 text-[#C4956A] mx-auto mb-4 stroke-[1.2]" />
            <p className="font-italic-serif text-rose-accent text-base mb-1">— próximamente</p>
            <h2 className="font-display text-2xl text-[#2C2420] mb-3">
              Historias y consejos florales
            </h2>
            <p className="font-body font-light text-sm text-[#8A7A6E] leading-relaxed mb-6">
              Estamos preparando nuestras primeras guías sobre cómo cuidar tus flores favoritas,
              elegir el arreglo perfecto para cada ocasión y el significado de los colores.
            </p>
            <Link
              to="/catalogo"
              className="inline-block px-8 h-11 bg-[#2C2420] text-white text-[11px] tracking-widest uppercase font-body font-light leading-[2.75rem] rounded-md hover:bg-[#40352F] transition-colors"
            >
              Explorar Catálogo
            </Link>
          </div>
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
