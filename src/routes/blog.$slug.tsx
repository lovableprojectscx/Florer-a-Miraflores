import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { Calendar, User, ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";

import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsappFab } from "@/components/WhatsappFab";
import { ProductGrid } from "@/components/ProductGrid";
import {
  getBlogPostPorSlug,
  getProductosPorCategoria,
  getCategorias,
  getConfig,
} from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { formatBlogDate, calculateReadingTime, generateBlogPostingSchema } from "@/lib/blog-utils";
import type { BlogPostRow, CategoriaRow, ProductoRow } from "@/types/database";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const [blogData, categorias, config] = await Promise.all([
      getBlogPostPorSlug(params.slug),
      getCategorias().catch(() => []),
      getConfig().catch(() => null),
    ]);

    if (!blogData) {
      throw notFound();
    }

    const { post, categoriaRelacionada, productosRelacionados } = blogData;

    let categoriaUrl = "/catalogo";
    if (categoriaRelacionada) {
      if (categoriaRelacionada.parent_id) {
        const parent = categorias.find((c) => c.id === categoriaRelacionada.parent_id);
        if (parent?.slug) {
          categoriaUrl = `/categoria/${parent.slug}/${categoriaRelacionada.slug}`;
        } else {
          categoriaUrl = `/categoria/${categoriaRelacionada.slug}`;
        }
      } else {
        categoriaUrl = `/categoria/${categoriaRelacionada.slug}`;
      }
    }

    return {
      post,
      categorias,
      config,
      productosRelacionados,
      categoriaRelacionada,
      categoriaUrl,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { post } = loaderData;
    const pageTitle = post.meta_title?.trim() || `${post.titulo} | Blog Florería Miraflores`;
    const pageDesc =
      post.meta_description?.trim() ||
      post.resumen?.trim() ||
      `Lee "${post.titulo}" en el blog de Florería Miraflores. Consejos y guías florales en Lima.`;

    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: pageDesc },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: pageDesc },
        ...(post.imagen_portada_url
          ? [{ property: "og:image", content: post.imagen_portada_url }]
          : []),
        { property: "og:type", content: "article" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FAF8F5] border border-[#E8DDD0] flex items-center justify-center text-[#C4956A] mb-4">
        <BookOpen className="w-8 h-8 stroke-[1.3]" />
      </div>
      <h1 className="font-display text-3xl sm:text-4xl mb-3 text-[#2C2420]">
        Artículo no encontrado
      </h1>
      <p className="font-body font-light text-sm text-[#8A7A6E] mb-6 max-w-md">
        El artículo que buscas no existe o aún no ha sido publicado. Explora otros artículos en
        nuestro blog.
      </p>
      <Link
        to="/blog"
        className="inline-flex items-center justify-center px-6 py-3 bg-[#2C2420] text-white text-xs uppercase tracking-widest font-body rounded hover:bg-[#1A1A1A] transition-colors"
      >
        Volver al Blog
      </Link>
    </div>
  ),
  component: BlogPostDetail,
});

function BlogPostDetail() {
  const { post, categorias, config, productosRelacionados, categoriaRelacionada, categoriaUrl } =
    Route.useLoaderData();

  const readingTime = calculateReadingTime(post.contenido);
  const jsonLd = generateBlogPostingSchema({ post });

  return (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col">
      {/* Inyección estructurada JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {config && <AnnouncementBar config={config} />}
      <Header categorias={categorias} config={config} />

      <main className="flex-1 w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 pt-4 md:pt-6 pb-16">
        {/* Breadcrumb compacto */}
        <nav
          aria-label="Ruta de navegación"
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-4 md:mb-6"
        >
          <Link to="/" className="hover:text-[#2C2420] transition-colors">
            Inicio
          </Link>
          <span aria-hidden className="text-[#8A7A6E]/60">
            /
          </span>
          <Link to="/blog" className="hover:text-[#2C2420] transition-colors">
            Blog
          </Link>
          <span aria-hidden className="text-[#8A7A6E]/60">
            /
          </span>
          <span className="text-[#2C2420] truncate max-w-[220px] sm:max-w-xs">{post.titulo}</span>
        </nav>

        {/* Contenedor central de lectura cómoda (~700-760px) */}
        <article className="max-w-[760px] mx-auto">
          {/* Volver al blog */}
          <div className="mb-4">
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A7A6E] hover:text-[#2C2420] uppercase tracking-wider font-body transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a artículos
            </Link>
          </div>

          {/* Encabezado del artículo */}
          <header className="mb-8">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#2C2420] leading-[1.2] font-normal mb-4">
              {post.titulo}
            </h1>

            {/* Metadatos: Fecha, Autor, Tiempo de lectura */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-body text-[#8A7A6E] pb-4 border-b border-[#E8DDD0]/70">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 stroke-[1.5]" />
                {formatBlogDate(post.fecha_publicacion)}
              </span>
              <span className="text-[#8A7A6E]/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 stroke-[1.5]" />
                {post.autor || "Florería Miraflores"}
              </span>
              <span className="text-[#8A7A6E]/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 stroke-[1.5]" />
                {readingTime} min de lectura
              </span>
            </div>
          </header>

          {/* Imagen de portada */}
          {post.imagen_portada_url && (
            <div className="mb-8 overflow-hidden rounded-xl bg-[#FAF8F5] border border-[#E8DDD0]/70 aspect-[16/9]">
              <img
                src={post.imagen_portada_url}
                alt={post.titulo}
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Resumen destacado */}
          {post.resumen && (
            <div className="mb-8 p-4 md:p-5 bg-[#FAF8F5] border-l-4 border-[#C4956A] rounded-r-lg">
              <p className="font-body font-normal text-sm md:text-base text-[#2C2420] italic leading-relaxed">
                {post.resumen}
              </p>
            </div>
          )}

          {/* Cuerpo en Markdown (sin HTML crudo) */}
          <div className="prose prose-stone max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="font-display text-2xl sm:text-3xl text-[#2C2420] mt-8 mb-4 font-normal leading-tight">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="font-display text-xl sm:text-2xl text-[#2C2420] mt-8 mb-3 font-normal leading-tight">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-display text-lg sm:text-xl text-[#2C2420] mt-6 mb-2 font-medium">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="font-body font-light text-base text-[#4A4036] leading-relaxed mb-5">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-5 space-y-2 font-body font-light text-[#4A4036] text-base">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-5 space-y-2 font-body font-light text-[#4A4036] text-base">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-[#C4956A] pl-4 my-6 italic text-[#6B5E55] font-serif bg-[#FAF8F5] py-2 rounded-r">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => {
                  const isExternal = href?.startsWith("http");
                  return (
                    <a
                      href={href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="text-[#C4956A] hover:underline font-medium transition-colors"
                    >
                      {children}
                    </a>
                  );
                },
                img: ({ src, alt }) => (
                  <span className="block my-6">
                    <img
                      src={src}
                      alt={alt || ""}
                      loading="lazy"
                      className="rounded-lg shadow-xs max-w-full h-auto mx-auto object-cover border border-[#E8DDD0]/50"
                    />
                    {alt && (
                      <span className="block text-center text-xs text-[#8A7A6E] mt-2 font-body font-light">
                        {alt}
                      </span>
                    )}
                  </span>
                ),
                hr: () => <hr className="my-8 border-[#E8DDD0]" />,
                strong: ({ children }) => (
                  <strong className="font-semibold text-[#2C2420]">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {post.contenido}
            </ReactMarkdown>
          </div>
        </article>

        {/* Bloque "Te puede gustar" si tiene productos relacionados */}
        {productosRelacionados.length > 0 && (
          <section className="mt-16 md:mt-24 border-t border-[#E8DDD0] pt-12 max-w-[1200px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="font-body text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-1 font-normal">
                  — Colección recomendada
                </p>
                <h2 className="font-display text-2xl sm:text-3xl text-[#2C2420] font-normal">
                  Te puede gustar
                </h2>
              </div>
              {categoriaRelacionada && (
                <Link
                  to={categoriaUrl}
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-body text-[#C4956A] hover:text-[#2C2420] transition-colors font-medium"
                >
                  Ver toda la categoría {categoriaRelacionada.nombre}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <ProductGrid products={productosRelacionados} />
          </section>
        )}
      </main>

      <Footer config={config} />
      <WhatsappFab config={config} />
    </div>
  );
}
